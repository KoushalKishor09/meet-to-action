from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from pymongo import MongoClient
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from pathlib import Path
import os
import json
import re
import asyncio
import telegram

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["meettask"]
tasks_collection = db["tasks"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported audio formats
SUPPORTED_AUDIO_FORMATS = {
    "audio/mpeg": [".mp3"],
    "audio/mp4": [".m4a", ".m4b"],
    "audio/x-m4a": [".m4a"],
    "audio/aac": [".aac"],
    "audio/ogg": [".ogg", ".oga"],
    "audio/wav": [".wav"],
    "audio/x-wav": [".wav"],
    "audio/flac": [".flac"],
    "audio/webm": [".webm"],
    "audio/x-ms-wma": [".wma"],
}

ALLOWED_EXTENSIONS = {ext for exts in SUPPORTED_AUDIO_FORMATS.values() for ext in exts}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_audio_file(filename: str, content_type: str, file_size: int):
    if file_size > 0 and file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file extension '{ext}'. Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA.",
        )


def build_extraction_prompt(text: str) -> str:
    return f"""
Analyze this meeting text and return a JSON object with two fields:
1. "summary": A 2-3 sentence summary of the meeting
2. "tasks": A list of tasks extracted from the meeting

Return ONLY this JSON format:
{{
    "summary": "",
    "tasks": [
        {{"task": "", "owner": "", "deadline": ""}}
    ]
}}

Rules:
- If the transcript contains a meeting date, use that as reference to convert relative dates like "tomorrow", "Sunday" into actual dates like "April 5, 2026"
- If no deadline mentioned, write "Not specified"
- Owner should be the person responsible
- Extract ALL tasks mentioned

Meeting text:
{text}
"""


def extract_tasks_from_text(text: str) -> dict:
    prompt = build_extraction_prompt(text)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.choices[0].message.content
    clean = re.sub(r"```json|```", "", raw).strip()

    try:
        result = json.loads(clean)
        for task in result.get("tasks", []):
            task["status"] = "Pending"
            task["created_at"] = datetime.now().isoformat()

        tasks_collection.delete_many({})
        if result.get("tasks"):
            tasks_collection.insert_many(result["tasks"])

        for task in result.get("tasks", []):
            task.pop("_id", None)

        return result
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw response: {raw}")
        return {"tasks": [], "summary": "", "error": "Could not parse the AI response. Please try again."}


# Telegram notification
async def send_telegram_message(message: str):
    try:
        bot = telegram.Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
        await bot.send_message(
            chat_id=os.getenv("TELEGRAM_CHAT_ID"),
            text=message,
            parse_mode="HTML",
        )
    except Exception as e:
        print(f"Telegram error: {e}")


# APScheduler — check every 20 seconds
def check_deadlines():
    print("\n🔔 Checking deadlines...")
    tasks = list(tasks_collection.find({"status": "Pending"}, {"_id": 0}))

    if not tasks:
        print("✅ No pending tasks right now!")
    else:
        message = "🔔 <b>Pending Task Reminders</b>\n\n"
        for task in tasks:
            print(
                f"⚠️ Pending Task: {task.get('task')} | Owner: {task.get('owner')} | Deadline: {task.get('deadline')}"
            )
            message += f"⚠️ <b>Task:</b> {task.get('task', 'N/A')}\n"
            message += f"👤 <b>Owner:</b> {task.get('owner', 'N/A')}\n"
            message += f"📅 <b>Deadline:</b> {task.get('deadline', 'N/A')}\n\n"

        asyncio.run(send_telegram_message(message))
    print("")


scheduler = None
if not os.environ.get("RUN_MAIN"):
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_deadlines, "interval", seconds=20)
    scheduler.start()


class InputText(BaseModel):
    text: str


class StatusUpdate(BaseModel):
    task: str
    status: str


@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}


# Fix favicon 404 noise in browser
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    icon_path = Path(__file__).parent / "favicon.ico"
    if icon_path.exists():
        return FileResponse(icon_path)
    return Response(status_code=204)


@app.get("/reminders")
def get_reminders():
    tasks = list(tasks_collection.find({"status": "Pending"}, {"_id": 0}))
    return {"pending_tasks": tasks, "count": len(tasks)}


@app.post("/update-status")
def update_status(data: StatusUpdate):
    result = tasks_collection.update_one(
        {"task": data.task},
        {"$set": {"status": data.status}},
    )
    if result.matched_count == 0:
        return {"message": "Task not found", "success": False}
    return {"message": "Status updated", "success": True}


@app.post("/extract")
def extract(data: InputText):
    return extract_tasks_from_text(data.text)


@app.get("/tasks")
def get_tasks():
    tasks = list(tasks_collection.find({}, {"_id": 0}))
    return {"tasks": tasks}


@app.post("/extract-audio")
async def extract_audio(file: UploadFile = File(...)):
    validate_audio_file(file.filename, file.content_type, 0)

    audio_bytes = await file.read()
    file_size = len(audio_bytes)
    print(f"📁 Received file: {file.filename}, size: {file_size / 1024:.1f} KB, MIME: {file.content_type}")

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )

    try:
        transcription = client.audio.transcriptions.create(
            file=(file.filename, audio_bytes),
            model="whisper-large-v3",
        )
        transcript_text = transcription.text
        if not transcript_text or not transcript_text.strip():
            return {"tasks": [], "summary": "", "transcript": "", "info": "No speech detected in the audio file."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to transcribe audio: {str(e)}")

    try:
        result = extract_tasks_from_text(transcript_text)
        result["transcript"] = transcript_text
        return result
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Could not parse the AI response. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task extraction failed: {str(e)}")


@app.on_event("shutdown")
def shutdown():
    if scheduler:
        scheduler.shutdown()
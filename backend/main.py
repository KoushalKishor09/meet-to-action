from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from pymongo import MongoClient
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import os
import json
import re

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

# Supported audio formats: MIME type -> list of valid extensions
SUPPORTED_AUDIO_FORMATS = {
    "audio/mpeg":    [".mp3"],
    "audio/mp4":     [".m4a", ".m4b"],
    "audio/x-m4a":   [".m4a"],
    "audio/aac":     [".aac"],
    "audio/ogg":     [".ogg", ".oga"],
    "audio/wav":     [".wav"],
    "audio/x-wav":   [".wav"],
    "audio/flac":    [".flac"],
    "audio/webm":    [".webm"],
    "audio/x-ms-wma": [".wma"],
}

ALLOWED_EXTENSIONS = {ext for exts in SUPPORTED_AUDIO_FORMATS.values() for ext in exts}

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_audio_file(filename: str, content_type: str, file_size: int):
    """Validate uploaded audio file for size (if > 0), extension, and MIME type."""
    if file_size > 0 and file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
        )

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file extension '{ext}'. Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA."
        )

    if content_type and content_type not in SUPPORTED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported MIME type '{content_type}'. Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA."
        )

# APScheduler setup
scheduler = BackgroundScheduler()

def check_deadlines():
    print("🔔 Checking deadlines...")
    tasks = list(tasks_collection.find({"status": "Pending"}, {"_id": 0}))
    for task in tasks:
        print(f"⚠️ Pending Task: {task['task']} | Owner: {task['owner']} | Deadline: {task['deadline']}")

scheduler.add_job(check_deadlines, "interval", minutes=1)
scheduler.start()

class InputText(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

@app.get("/reminders")
def get_reminders():
    tasks = list(tasks_collection.find({"status": "Pending"}, {"_id": 0}))
    return {"pending_tasks": tasks, "count": len(tasks)}

class StatusUpdate(BaseModel):
    task: str
    status: str

@app.post("/update-status")
def update_status(data: StatusUpdate):
    tasks_collection.update_one(
        {"task": data.task},
        {"$set": {"status": data.status}}
    )
    return {"message": "Status updated"}

def build_extraction_prompt(text: str) -> str:
    """Build the standard task-extraction prompt for the given meeting text."""
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
    """Send meeting text to the LLM, parse the response, and persist tasks to MongoDB."""
    prompt = build_extraction_prompt(text)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.choices[0].message.content
    clean = re.sub(r"```json|```", "", raw).strip()
    try:
        result = json.loads(clean)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw response: {raw}")
        raise
    for task in result["tasks"]:
        task["status"] = "Pending"
        task["created_at"] = datetime.now().isoformat()
    if result["tasks"]:
        tasks_collection.insert_many(result["tasks"])
    for task in result["tasks"]:
        task.pop("_id", None)
    return result


@app.post("/extract")
def extract(data: InputText):
    try:
        return extract_tasks_from_text(data.text)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return {"tasks": [], "summary": "", "error": "Could not parse the AI response. Please try again."}

@app.get("/tasks")
def get_tasks():
    tasks = list(tasks_collection.find({}, {"_id": 0}))
    return {"tasks": tasks}

@app.post("/extract-audio")
async def extract_audio(file: UploadFile = File(...)):
    # Validate extension and MIME type before reading the full file body
    validate_audio_file(file.filename, file.content_type, 0)

    # Read file and enforce size limit
    audio_bytes = await file.read()
    file_size = len(audio_bytes)

    print(f"📁 Received file: {file.filename}, size: {file_size / 1024:.1f} KB, MIME: {file.content_type}")

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
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
    scheduler.shutdown()
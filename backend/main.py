from fastapi import FastAPI, UploadFile, File
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

@app.post("/extract")
def extract(data: InputText):
    prompt = f"""
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
{data.text}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.choices[0].message.content
    clean = re.sub(r"```json|```", "", raw).strip()
    try:
        result = json.loads(clean)
        for task in result["tasks"]:
            task["status"] = "Pending"
            task["created_at"] = datetime.now().isoformat()
        tasks_collection.insert_many(result["tasks"])
        for task in result["tasks"]:
            task.pop("_id", None)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw response: {raw}")
        result = {"tasks": [], "summary": "", "error": "Could not parse the AI response. Please try again."}
    return result

@app.get("/tasks")
def get_tasks():
    tasks = list(tasks_collection.find({}, {"_id": 0}))
    return {"tasks": tasks}

@app.post("/extract-audio")
async def extract_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        transcription = client.audio.transcriptions.create(
            file=(file.filename, audio_bytes),
            model="whisper-large-v3",
        )
        transcript_text = transcription.text
        prompt = f"""
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
{transcript_text}
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content
        clean = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(clean)
        for task in result["tasks"]:
            task["status"] = "Pending"
            task["created_at"] = datetime.now().isoformat()
        tasks_collection.insert_many(result["tasks"])
        for task in result["tasks"]:
            task.pop("_id", None)
        result["transcript"] = transcript_text
        return result
    except Exception as e:
        return {"tasks": [], "summary": "", "error": str(e)}

@app.on_event("shutdown")
def shutdown():
    scheduler.shutdown()
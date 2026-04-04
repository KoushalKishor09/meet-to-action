from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os
import json
import re

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputText(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

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
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw response: {raw}")
        result = {"tasks": [], "summary": "", "error": "Could not parse the AI response. Please try again."}
    return result
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os

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
Extract tasks from this meeting text.
Return ONLY a JSON array like this:
[
    {{"task": "", "owner": "", "deadline": ""}}
]

Rules:
- If the transcript contains a meeting date, use that as reference to convert relative dates like "tomorrow", "Sunday", "next Monday" into actual dates like "April 6, 2026"
- If no meeting date is found in transcript, use relative terms as they are
- Extract ALL tasks mentioned
- Owner should be the person responsible
- If no deadline mentioned, write "Not specified"

Meeting text:
{data.text}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return {"tasks": response.choices[0].message.content}
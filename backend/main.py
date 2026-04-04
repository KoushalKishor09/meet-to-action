from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

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
    Meeting text:
    {data.text}
    """
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return {"tasks": response.text}
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import google.generativeai as genai
import os
import re

# =========================
# ENV + GEMINI
# =========================

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")

# =========================
# FASTAPI
# =========================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# REQUEST MODELS
# =========================

class InterviewRequest(BaseModel):
    role: str


class ResumeQuestionRequest(BaseModel):
    role: str
    resume_text: str


class AnswerRequest(BaseModel):
    question: str
    answer: str


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():
    return {
        "message": "InterviewAce AI Backend Running 🚀"
    }


# =========================
# UPLOAD RESUME
# =========================

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    try:

        pdf = PdfReader(file.file)

        text = ""

        for page in pdf.pages:

            extracted = page.extract_text()

            if extracted:
                text += extracted + "\n"

        return {
            "resume_text": text[:5000]
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================
# GENERATE NORMAL QUESTION
# =========================

@app.post("/generate-question")
def generate_question(data: InterviewRequest):

    prompt = f"""
You are a senior technical interviewer.

Generate ONE interview question for:

Role: {data.role}

Rules:
- Technical question only
- Role specific
- No numbering
- No explanation
- Return only the question
"""

    try:

        response = model.generate_content(prompt)

        return {
            "role": data.role,
            "question": response.text.strip()
        }

    except Exception as e:

        print("QUESTION ERROR:", repr(e))

        return {
            "error": str(e)
        }


# =========================
# RESUME BASED QUESTION
# =========================

@app.post("/generate-resume-question")
def generate_resume_question(data: ResumeQuestionRequest):

    prompt = f"""
You are a senior technical interviewer.

Candidate Role:
{data.role}

Resume Content:
{data.resume_text}

Generate ONE technical interview question
based on the resume.

Rules:
- Technical only
- Resume based
- Role specific
- Return only the question
"""

    try:

        response = model.generate_content(prompt)

        return {
            "question": response.text.strip()
        }

    except Exception as e:

        print("RESUME QUESTION ERROR:", repr(e))

        return {
            "error": str(e)
        }


# =========================
# EVALUATE ANSWER
# =========================

@app.post("/evaluate-answer")
def evaluate_answer(data: AnswerRequest):

    print("\n========================")
    print("QUESTION:", data.question)
    print("ANSWER:", data.answer)
    print("========================\n")

    prompt = f"""
You are an expert technical interviewer.

Question:
{data.question}

Candidate Answer:
{data.answer}

Evaluate the answer.

Return ONLY in this format:

Score: X/10
Feedback: <feedback>
Suggestion: <suggestion>
"""

    try:

        response = model.generate_content(prompt)

        evaluation = response.text.strip()

        print("GEMINI RESPONSE:")
        print(evaluation)

        score = ""
        feedback = ""
        suggestion = ""

        score_match = re.search(
            r"Score:\s*(\d+)",
            evaluation,
            re.IGNORECASE
        )

        feedback_match = re.search(
            r"Feedback:\s*(.*?)(?=Suggestion:|$)",
            evaluation,
            re.IGNORECASE | re.DOTALL
        )

        suggestion_match = re.search(
            r"Suggestion:\s*(.*)",
            evaluation,
            re.IGNORECASE | re.DOTALL
        )

        if score_match:
            score = score_match.group(1)

        if feedback_match:
            feedback = feedback_match.group(1).strip()

        if suggestion_match:
            suggestion = suggestion_match.group(1).strip()

        return {
            "score": score,
            "feedback": feedback,
            "suggestion": suggestion
        }

    except Exception as e:

        print("FULL ERROR:")
        print(repr(e))

        return {
            "error": str(e)
        }
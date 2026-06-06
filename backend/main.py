from fastapi.responses import FileResponse
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)
from reportlab.lib.styles import getSampleStyleSheet
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import google.generativeai as genai
import requests
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

def ask_llm(prompt):

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemma-4-31b-it:free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        },
        timeout=60
    )

    data = response.json()

    return data["choices"][0]["message"]["content"]

# =========================
# FASTAPI
# =========================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

class ReportRequest(BaseModel):
    role: str
    average_score: str
    history: list


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():
    return {
        "message": "RoleForge AI Backend Running 🚀"
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

        question = ask_llm(prompt)

        return {
            "role": data.role,
            "question": question.strip()
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

        question = ask_llm(prompt)

        return {
            "question": question.strip()
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

        evaluation = ask_llm(prompt).strip()

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
@app.post("/generate-report")
def generate_report(data: ReportRequest):

    pdf_file = "Interview_Report.pdf"

    doc = SimpleDocTemplate(pdf_file)

    styles = getSampleStyleSheet()

    content = []

    # Title

    content.append(
        Paragraph(
            "RoleForge AI Report",
            styles["Title"]
        )
    )

    content.append(Spacer(1, 20))

    # Summary

    content.append(
        Paragraph(
            f"<b>Role:</b> {data.role}",
            styles["Normal"]
        )
    )

    content.append(
        Paragraph(
            f"<b>Average Score:</b> {data.average_score}/10",
            styles["Normal"]
        )
    )

    content.append(Spacer(1, 20))

    # Questions History

    for index, item in enumerate(data.history):

        content.append(
            Paragraph(
                f"<b>Question {index + 1}</b>",
                styles["Heading2"]
            )
        )

        content.append(
            Paragraph(
                f"Question: {item['question']}",
                styles["Normal"]
            )
        )

        content.append(
            Paragraph(
                f"Answer: {item['answer']}",
                styles["Normal"]
            )
        )

        content.append(
            Paragraph(
                f"Score: {item['score']}/10",
                styles["Normal"]
            )
        )

        content.append(
            Paragraph(
                f"Feedback: {item['feedback']}",
                styles["Normal"]
            )
        )

        content.append(
            Paragraph(
                f"Suggestion: {item['suggestion']}",
                styles["Normal"]
            )
        )

        content.append(Spacer(1, 15))

    # Final Verdict

    avg = float(data.average_score)

    if avg >= 8:
        verdict = "Excellent Performance"
    elif avg >= 6:
        verdict = "Good Performance"
    elif avg >= 4:
        verdict = "Average Performance"
    else:
        verdict = "Needs Improvement"

    content.append(Spacer(1, 20))

    content.append(
        Paragraph(
            f"<b>Final Verdict:</b> {verdict}",
            styles["Heading2"]
        )
    )

    doc.build(content)

    return FileResponse(
        pdf_file,
        media_type="application/pdf",
        filename="Interview_Report.pdf"
    )
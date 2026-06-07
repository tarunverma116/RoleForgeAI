from fastapi.responses import FileResponse
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas as rl_canvas
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import requests
import os
import re
import json
import random
from typing import List
from datetime import datetime

load_dotenv()

# =========================
# FALLBACK QUESTIONS BANK
# =========================

FALLBACK_QUESTIONS = {
    "Python Developer": {
        "easy": [
            "What is the difference between a list and a tuple in Python?",
            "Explain how Python's garbage collection works.",
            "What are Python decorators and how do you use them?",
            "What is the difference between `==` and `is` in Python?",
            "How does Python handle multiple inheritance? Explain the MRO.",
        ],
        "medium": [
            "Explain the difference between `@staticmethod` and `@classmethod` in Python.",
            "How would you optimize a Python function that processes a very large list?",
            "What are Python generators and when would you use them over a list?",
            "Describe how you would implement a thread-safe singleton in Python.",
            "Explain Python's GIL — what it is, why it exists, and its impact on multithreading.",
        ],
        "hard": [
            "Design a Python async pipeline that processes streaming data with back-pressure support.",
            "How would you implement a custom memory allocator for a Python extension module?",
            "Explain the internals of Python's `asyncio` event loop and how coroutines are scheduled.",
            "How would you build a distributed task queue from scratch using Python primitives?",
            "Describe how you would profile and fix a Python service with unpredictable latency spikes.",
        ],
    },
    "Frontend Developer": {
        "easy": [
            "What is the difference between `var`, `let`, and `const` in JavaScript?",
            "Explain the CSS box model and how `box-sizing: border-box` changes it.",
            "What is the virtual DOM in React and why is it used?",
            "Describe the difference between `display: flex` and `display: grid`.",
            "What are React hooks and why were they introduced?",
        ],
        "medium": [
            "How does React's reconciliation algorithm decide what to re-render?",
            "Explain how you would implement code splitting and lazy loading in a React app.",
            "What is the difference between controlled and uncontrolled components in React?",
            "Describe your approach to managing global state in a large React application.",
            "How would you optimize a React component that renders a list of 10,000 items?",
        ],
        "hard": [
            "Design a micro-frontend architecture for a large enterprise web application.",
            "How would you implement a real-time collaborative editor (like Google Docs) in React?",
            "Describe the rendering pipeline of a modern browser and how it affects your CSS decisions.",
            "How would you architect a React application to achieve a Lighthouse performance score above 95?",
            "Explain how you would build a custom React renderer that outputs to a canvas instead of the DOM.",
        ],
    },
    "Backend Developer": {
        "easy": [
            "What is the difference between REST and GraphQL?",
            "Explain what an index is in a relational database and why it improves query performance.",
            "What is the difference between SQL and NoSQL databases?",
            "Describe the HTTP request-response lifecycle.",
            "What is JWT and how does it work for authentication?",
        ],
        "medium": [
            "How would you design a rate-limiting system for a public API?",
            "Explain the CAP theorem and how it influences your database choice.",
            "Describe how you would implement database connection pooling and why it matters.",
            "How would you approach debugging a backend service with intermittent 500 errors in production?",
            "What are database transactions and what are the ACID properties?",
        ],
        "hard": [
            "Design a horizontally scalable job queue system that guarantees exactly-once delivery.",
            "How would you architect a backend that handles 1 million concurrent WebSocket connections?",
            "Describe your approach to zero-downtime database schema migrations in a live system.",
            "How would you design a distributed caching layer to reduce database load by 90%?",
            "Explain how you would implement a multi-tenant SaaS backend with strict data isolation.",
        ],
    },
    "Data Analyst": {
        "easy": [
            "What is the difference between `GROUP BY` and `PARTITION BY` in SQL?",
            "Explain the difference between a left join and an inner join.",
            "What is the purpose of data normalization and when would you denormalize?",
            "Describe the difference between mean, median, and mode and when each is most useful.",
            "What is a pivot table and how would you create one in SQL?",
        ],
        "medium": [
            "How would you detect and handle outliers in a dataset before analysis?",
            "Explain the difference between correlation and causation with a real-world example.",
            "How would you design an A/B test to measure the impact of a new feature?",
            "Describe how you would build a dashboard to monitor key business metrics in real time.",
            "What is cohort analysis and how would you implement it in SQL?",
        ],
        "hard": [
            "Design a data pipeline that ingests 50GB of raw event data daily and makes it queryable within 5 minutes.",
            "How would you build a churn prediction model and translate its output into actionable business decisions?",
            "Describe your approach to root-cause analysis when a key metric drops 30% overnight.",
            "How would you design a self-serve analytics platform for non-technical business users?",
            "Explain how you would implement slowly changing dimensions (SCD Type 2) in a data warehouse.",
        ],
    },
    "Machine Learning Engineer": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain the bias-variance tradeoff and how it affects model selection.",
            "What is cross-validation and why is it used instead of a simple train-test split?",
            "Describe what overfitting is and name three techniques to prevent it.",
            "What is the difference between precision and recall, and when would you prioritize each?",
        ],
        "medium": [
            "How would you handle a severely imbalanced dataset in a binary classification problem?",
            "Explain how gradient boosting works and how it differs from random forests.",
            "Describe how you would set up a feature store for a team of 20 ML engineers.",
            "How would you design an ML pipeline that retrains automatically when model performance degrades?",
            "What is attention in transformer models and why was it a breakthrough over RNNs?",
        ],
        "hard": [
            "Design a real-time fraud detection system that scores transactions in under 10ms with ML.",
            "How would you build and deploy a large language model fine-tuning pipeline for a domain-specific task?",
            "Describe your approach to reducing the inference latency of a large transformer model by 5x.",
            "How would you architect an ML platform that supports 100 teams each running independent experiments?",
            "Explain how you would implement online learning for a recommendation system with concept drift.",
        ],
    },
    "Generic Software Engineer": {
        "easy": [
            "Explain the difference between a stack and a queue and give a use case for each.",
            "What is the difference between process and thread?",
            "Describe the SOLID principles and give an example for each.",
            "What is the time complexity of common operations on a hash map?",
            "What is the difference between TCP and UDP?",
        ],
        "medium": [
            "How would you design a URL shortener like bit.ly from scratch?",
            "Explain what a deadlock is and how you would detect and prevent it.",
            "Describe the differences between monolithic and microservice architectures.",
            "How would you implement an LRU cache? What data structures would you use?",
            "Explain eventual consistency and when you would accept it over strong consistency.",
        ],
        "hard": [
            "Design a distributed key-value store similar to DynamoDB.",
            "How would you architect a system that serves 10 million requests per second globally?",
            "Describe how you would build a real-time collaborative platform where 1000 users edit shared documents simultaneously.",
            "How would you design and implement a consensus algorithm for a distributed system?",
            "Explain how you would approach migrating a 10-year-old monolith to microservices with zero downtime.",
        ],
    },
    "ML Engineer": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain the bias-variance tradeoff and how it affects model selection.",
            "What is cross-validation and why is it used?",
            "Describe what overfitting is and name three techniques to prevent it.",
            "What is the difference between precision and recall?",
        ],
        "medium": [
            "How would you handle a severely imbalanced dataset in a classification problem?",
            "Explain how gradient boosting works and how it differs from random forests.",
            "How would you design an ML pipeline that retrains automatically when model performance degrades?",
            "What is attention in transformer models and why was it a breakthrough over RNNs?",
            "Describe how you would build and monitor a feature store for a team of ML engineers.",
        ],
        "hard": [
            "Design a real-time fraud detection system that scores transactions in under 10ms.",
            "How would you build and deploy a fine-tuning pipeline for a domain-specific LLM?",
            "Describe your approach to reducing the inference latency of a large transformer model by 5x.",
            "How would you architect an ML platform that supports 100 teams with independent experiments?",
            "Explain how you would implement online learning for a recommendation system with concept drift.",
        ],
    },
    "Java Developer": {
        "easy": [
            "What is the difference between an interface and an abstract class in Java?",
            "Explain how the Java garbage collector works and name two GC algorithms.",
            "What is the difference between `HashMap` and `ConcurrentHashMap`?",
            "Describe the four pillars of object-oriented programming with Java examples.",
            "What are Java generics and why are they useful?",
        ],
        "medium": [
            "How does the Java memory model handle visibility and ordering of shared variables?",
            "Explain the difference between `synchronized`, `volatile`, and `java.util.concurrent` locks.",
            "How would you design a connection pool in Java from scratch?",
            "Describe how Spring Boot's dependency injection container works internally.",
            "What are Java streams and how do they differ from traditional loops in terms of performance?",
        ],
        "hard": [
            "Design a high-throughput message broker in Java using non-blocking I/O.",
            "How would you implement a custom class loader to support hot-swapping code at runtime?",
            "Describe how the JIT compiler optimises bytecode — what are escape analysis and inlining?",
            "How would you build a distributed transaction manager for a microservices system in Java?",
            "Explain how you would diagnose and resolve a memory leak in a running Java production service.",
        ],
    },
    "AIML Intern": {
        "easy": [
            "What is the difference between AI, Machine Learning, and Deep Learning?",
            "Explain what a neural network is and how it learns from data.",
            "What is the purpose of an activation function in a neural network?",
            "Describe the difference between classification and regression problems.",
            "What is feature engineering and why is it important in machine learning?",
        ],
        "medium": [
            "Explain how backpropagation works to train a neural network.",
            "What is transfer learning and how would you apply it to a text classification problem?",
            "How would you evaluate the performance of an NLP model beyond accuracy?",
            "Describe the architecture of a convolutional neural network and its use cases.",
            "What is the vanishing gradient problem and how do modern architectures address it?",
        ],
        "hard": [
            "Explain the transformer architecture in detail, including self-attention and positional encoding.",
            "How would you fine-tune a pre-trained language model for a domain-specific task with limited data?",
            "Describe how you would implement a RAG (Retrieval-Augmented Generation) pipeline.",
            "How would you design an evaluation framework for a generative AI system?",
            "Explain the differences between RLHF, DPO, and PPO for aligning language models.",
        ],
    },
}

# Fallback key for roles not in the map
FALLBACK_DEFAULT_KEY = "Generic Software Engineer"


def get_fallback_questions(role: str, difficulty: str) -> List[str]:
    """Return 5 fallback questions for the given role and difficulty."""
    # Try exact match first, then case-insensitive
    questions_bank = FALLBACK_QUESTIONS.get(role)
    if not questions_bank:
        for key in FALLBACK_QUESTIONS:
            if key.lower() == role.lower():
                questions_bank = FALLBACK_QUESTIONS[key]
                break
    if not questions_bank:
        questions_bank = FALLBACK_QUESTIONS[FALLBACK_DEFAULT_KEY]

    level = difficulty.lower() if difficulty.lower() in ("easy", "medium", "hard") else "medium"
    pool = questions_bank.get(level, questions_bank.get("medium", []))

    # Shuffle so repeated fallback sessions feel varied
    shuffled = pool[:]
    random.shuffle(shuffled)
    return shuffled[:5]


# =========================
# LLM HELPER
# =========================

def ask_llm(prompt):
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "model": "google/gemma-4-31b-it:free",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60,
    )

    data = response.json()
    print("STATUS:", response.status_code)
    print("DATA:", data)

    if response.status_code != 200:
        raise Exception(f"OpenRouter Error: {data}")

    if "choices" not in data:
        raise Exception(f"No choices returned: {data}")

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
    difficulty: str = "medium"


class ResumeQuestionRequest(BaseModel):
    role: str
    resume_text: str
    difficulty: str = "medium"


class AnswerRequest(BaseModel):
    question: str
    answer: str
    difficulty: str = "medium"


class ReportRequest(BaseModel):
    role: str
    average_score: str
    history: list


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():
    return {"message": "RoleForge AI Backend Running 🚀"}


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
        return {"resume_text": text[:5000]}
    except Exception as e:
        return {"error": str(e)}


# =========================
# GENERATE 5 QUESTIONS (BATCH) — NORMAL
# =========================

def _parse_questions_from_response(raw: str) -> List[str]:
    """
    Robustly extract exactly 5 questions from the LLM response.
    Tries JSON first, then numbered list fallback.
    """
    # ── Attempt 1: JSON array in the response ──────────────────────
    json_match = re.search(r'\{.*?"questions"\s*:\s*(\[.*?\])', raw, re.DOTALL)
    if json_match:
        try:
            questions = json.loads(json_match.group(1))
            clean = [q.strip() for q in questions if isinstance(q, str) and q.strip()]
            if len(clean) >= 5:
                return clean[:5]
        except json.JSONDecodeError:
            pass

    # ── Attempt 2: bare JSON array ─────────────────────────────────
    array_match = re.search(r'\[.*?\]', raw, re.DOTALL)
    if array_match:
        try:
            questions = json.loads(array_match.group(0))
            clean = [q.strip() for q in questions if isinstance(q, str) and q.strip()]
            if len(clean) >= 5:
                return clean[:5]
        except json.JSONDecodeError:
            pass

    # ── Attempt 3: numbered lines (1. / 1) / Q1: etc.) ────────────
    lines = re.split(r'\n', raw)
    numbered = []
    for line in lines:
        line = line.strip()
        # Match patterns like: 1. / 1) / Q1. / Question 1: / **1.**
        m = re.match(r'^(?:\*{0,2}(?:Q(?:uestion)?\s*)?\d+[\.\):\s]+\*{0,2})\s*(.+)', line, re.IGNORECASE)
        if m:
            question = m.group(1).strip().strip('*').strip()
            if question and len(question) > 10:
                numbered.append(question)

    if len(numbered) >= 5:
        return numbered[:5]

    # ── Attempt 4: split on double newlines, take non-empty chunks ─
    chunks = [c.strip() for c in re.split(r'\n{2,}', raw) if c.strip() and len(c.strip()) > 20]
    if len(chunks) >= 5:
        return chunks[:5]

    # ── Attempt 5: any lines longer than 30 chars that look like questions ─
    candidates = [l.strip() for l in lines if len(l.strip()) > 30]
    if len(candidates) >= 5:
        return candidates[:5]

    raise ValueError(f"Could not extract 5 questions from LLM response. Got {len(numbered)} numbered items.")


@app.post("/generate-question")
def generate_question(data: InterviewRequest):
    """
    Returns 5 interview questions in a single API call.
    Falls back to local question bank on any failure.
    """
    prompt = f"""You are a senior technical interviewer conducting a mock interview.

Role: {data.role}
Difficulty: {data.difficulty}

Generate exactly 5 unique, high-quality interview questions for this role and difficulty level.

Rules:
- Each question must be specific to the role
- Difficulty: {"fundamental concepts" if data.difficulty == "easy" else "practical application and design" if data.difficulty == "medium" else "expert-level system design and deep technical knowledge"}
- Questions must be diverse — cover different sub-topics, not variations of the same question
- No numbering, no preamble, no explanation — return ONLY a JSON object
- Do not include any text before or after the JSON

Return this exact JSON format:
{{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here",
    "Question 4 text here",
    "Question 5 text here"
  ]
}}"""

    try:
        raw = ask_llm(prompt)
        questions = _parse_questions_from_response(raw)
        return {
            "role": data.role,
            "questions": questions,
            "source": "ai",
        }

    except Exception as e:
        print("QUESTION GENERATION ERROR — using fallback:", repr(e))
        questions = get_fallback_questions(data.role, data.difficulty)
        return {
            "role": data.role,
            "questions": questions,
            "source": "fallback",
        }


# =========================
# GENERATE 5 QUESTIONS (BATCH) — RESUME-BASED
# =========================

@app.post("/generate-resume-question")
def generate_resume_question(data: ResumeQuestionRequest):
    """
    Returns 5 resume-tailored interview questions in a single API call.
    Falls back to local question bank on any failure.
    """
    prompt = f"""You are a senior technical interviewer conducting a personalised mock interview.

Candidate Role: {data.role}
Difficulty: {data.difficulty}

Resume Content:
{data.resume_text}

Generate exactly 5 unique interview questions tailored to the candidate's resume and role.

Rules:
- Each question should reference or build upon skills, technologies, or experiences from the resume
- Difficulty: {"fundamental concepts" if data.difficulty == "easy" else "practical application and design" if data.difficulty == "medium" else "expert-level system design and deep technical knowledge"}
- Questions must be diverse — cover different aspects of their background
- No numbering, no preamble, no explanation — return ONLY a JSON object
- Do not include any text before or after the JSON

Return this exact JSON format:
{{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here",
    "Question 4 text here",
    "Question 5 text here"
  ]
}}"""

    try:
        raw = ask_llm(prompt)
        questions = _parse_questions_from_response(raw)
        return {
            "questions": questions,
            "source": "ai",
        }

    except Exception as e:
        print("RESUME QUESTION ERROR — using fallback:", repr(e))
        questions = get_fallback_questions(data.role, data.difficulty)
        return {
            "questions": questions,
            "source": "fallback",
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

    prompt = f"""You are an expert technical interviewer.

Question:
{data.question}

Candidate Answer:
{data.answer}

Evaluate the answer.

Return ONLY in this format:

Score: X/10
Feedback: <feedback>
Suggestion: <suggestion>"""

    try:
        evaluation = ask_llm(prompt).strip()
        print("LLM EVALUATION RESPONSE:")
        print(evaluation)

        score = ""
        feedback = ""
        suggestion = ""

        score_match = re.search(r"Score:\s*(\d+)", evaluation, re.IGNORECASE)
        feedback_match = re.search(
            r"Feedback:\s*(.*?)(?=Suggestion:|$)", evaluation, re.IGNORECASE | re.DOTALL
        )
        suggestion_match = re.search(r"Suggestion:\s*(.*)", evaluation, re.IGNORECASE | re.DOTALL)

        if score_match:
            score = score_match.group(1)
        if feedback_match:
            feedback = feedback_match.group(1).strip()
        if suggestion_match:
            suggestion = suggestion_match.group(1).strip()

        return {"score": score, "feedback": feedback, "suggestion": suggestion}

    except Exception as e:
        print("EVALUATE ERROR:", repr(e))
        return {"error": str(e)}


# =========================
# PDF DESIGN CONSTANTS
# =========================

ACCENT       = colors.HexColor("#059669")
ACCENT_DARK  = colors.HexColor("#047857")
ACCENT_LIGHT = colors.HexColor("#D1FAE5")
HEADER_BG    = colors.HexColor("#111827")
BODY_BG      = colors.HexColor("#F9FAFB")
CARD_BG      = colors.HexColor("#FFFFFF")
CARD_BORDER  = colors.HexColor("#E5E7EB")
SECTION_HEAD = colors.HexColor("#111827")
FOOTER_BG    = colors.HexColor("#F3F4F6")
FOOTER_TEXT  = colors.HexColor("#6B7280")
SUB_TEXT     = colors.HexColor("#6EE7B7")
GRAY_TEXT    = colors.HexColor("#6B7280")
DARK_TEXT    = colors.HexColor("#111827")
WHITE        = colors.white
VERDICT_BG   = colors.HexColor("#047857")
VERDICT_TEXT = colors.white

SCORE_EXCELLENT = colors.HexColor("#059669")
SCORE_GOOD      = colors.HexColor("#0284C7")
SCORE_AVERAGE   = colors.HexColor("#D97706")
SCORE_POOR      = colors.HexColor("#DC2626")


def _score_color(score_str):
    try:
        s = float(score_str)
    except (ValueError, TypeError):
        return GRAY_TEXT
    if s >= 8:
        return SCORE_EXCELLENT
    if s >= 6:
        return SCORE_GOOD
    if s >= 4:
        return SCORE_AVERAGE
    return SCORE_POOR


def _verdict(avg):
    if avg >= 8:
        return ("Excellent Performance", "You demonstrated outstanding knowledge and skill.", VERDICT_BG)
    if avg >= 6:
        return ("Good Performance", "You showed solid understanding with room for growth.", SCORE_GOOD)
    if avg >= 4:
        return ("Average Performance", "You have a foundation to build on — keep practising.", SCORE_AVERAGE)
    return ("Needs Improvement", "Focus on strengthening your fundamentals.", SCORE_POOR)


def _build_styles():
    base = getSampleStyleSheet()

    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "report_title": ps(
            "ReportTitle",
            fontSize=28, leading=34,
            textColor=WHITE, fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "report_subtitle": ps(
            "ReportSubtitle",
            fontSize=12, leading=16,
            textColor=SUB_TEXT,
            fontName="Helvetica", alignment=TA_CENTER,
        ),
        "meta_label": ps(
            "MetaLabel",
            fontSize=9, leading=13,
            textColor=GRAY_TEXT, fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "meta_value": ps(
            "MetaValue",
            fontSize=11, leading=15,
            textColor=DARK_TEXT, fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "section_header": ps(
            "SectionHeader",
            fontSize=13, leading=17,
            textColor=SECTION_HEAD, fontName="Helvetica-Bold",
        ),
        "q_number": ps(
            "QNumber",
            fontSize=10, leading=14,
            textColor=WHITE, fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "q_title": ps(
            "QTitle",
            fontSize=12, leading=16,
            textColor=ACCENT_DARK, fontName="Helvetica-Bold",
        ),
        "field_label": ps(
            "FieldLabel",
            fontSize=9, leading=12,
            textColor=ACCENT, fontName="Helvetica-Bold",
            spaceAfter=2,
        ),
        "field_value": ps(
            "FieldValue",
            fontSize=10, leading=14,
            textColor=DARK_TEXT, fontName="Helvetica",
            spaceAfter=6,
        ),
        "score_big": ps(
            "ScoreBig",
            fontSize=22, leading=26,
            fontName="Helvetica-Bold", alignment=TA_CENTER,
        ),
        "score_label": ps(
            "ScoreLabel",
            fontSize=8, leading=11,
            textColor=GRAY_TEXT, fontName="Helvetica",
            alignment=TA_CENTER,
        ),
        "verdict_title": ps(
            "VerdictTitle",
            fontSize=16, leading=20,
            textColor=VERDICT_TEXT, fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "verdict_sub": ps(
            "VerdictSub",
            fontSize=10, leading=14,
            textColor=SUB_TEXT,
            fontName="Helvetica", alignment=TA_CENTER,
        ),
        "footer_text": ps(
            "FooterText",
            fontSize=8, leading=10,
            textColor=FOOTER_TEXT, fontName="Helvetica",
            alignment=TA_CENTER,
        ),
    }


class _PageDecorator:
    """Draws a branded header stripe + footer on every page."""

    def __init__(self, role: str, total_pages_placeholder):
        self.role = role
        self._tp = total_pages_placeholder

    def __call__(self, canv, doc):
        w, h = A4
        canv.saveState()
        canv.setFillColor(HEADER_BG)
        canv.rect(0, h - 28, w, 28, fill=1, stroke=0)
        canv.setFillColor(WHITE)
        canv.setFont("Helvetica-Bold", 8)
        canv.drawString(0.4 * inch, h - 18, "RoleForge AI")
        canv.setFillColor(SUB_TEXT)
        canv.setFont("Helvetica", 8)
        canv.drawRightString(w - 0.4 * inch, h - 18, f"Role: {self.role}")
        canv.setFillColor(FOOTER_BG)
        canv.rect(0, 0, w, 26, fill=1, stroke=0)
        canv.setFillColor(FOOTER_TEXT)
        canv.setFont("Helvetica", 7.5)
        canv.drawString(0.4 * inch, 9, "Generated by RoleForge AI  •  Confidential")
        canv.drawRightString(w - 0.4 * inch, 9, f"Page {doc.page}")
        canv.restoreState()


# =========================
# GENERATE PDF REPORT
# =========================

@app.post("/generate-report")
def generate_report(data: ReportRequest):
    pdf_file = "Interview_Report.pdf"
    S = _build_styles()

    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.55 * inch,
    )

    decorator = _PageDecorator(data.role, None)
    content = []
    w_inner = A4[0] - 1.3 * inch

    # ── 1. HERO HEADER ────────────────────────────────────────────
    hero_inner = [
        [Paragraph("RoleForge AI", S["report_title"])],
        [Paragraph("AI-Powered Mock Interview Report", S["report_subtitle"])],
        [Spacer(1, 6)],
        [Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y  •  %I:%M %p')}",
            S["report_subtitle"],
        )],
    ]
    hero = Table(hero_inner, colWidths=[w_inner])
    hero.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HEADER_BG),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("ROUNDEDCORNERS", [6]),
    ]))
    content.append(hero)
    content.append(Spacer(1, 18))

    # ── 2. SUMMARY CARDS ─────────────────────────────────────────
    avg = float(data.average_score)
    total_q = len(data.history)
    attempted = sum(1 for i in data.history if i.get("answer", "").strip())
    v_title, v_sub, v_color = _verdict(avg)
    s_color = _score_color(data.average_score)

    avg_hex = s_color.hexval()[2:] if hasattr(s_color, "hexval") else "111827"
    cards_data = [[
        Table([[Paragraph(f'<font color="#{avg_hex}">{data.average_score}/10</font>', S["meta_value"])],
               [Paragraph("Average Score", S["meta_label"])]]),
        Table([[Paragraph(str(total_q), S["meta_value"])],
               [Paragraph("Total Questions", S["meta_label"])]]),
        Table([[Paragraph(str(attempted), S["meta_value"])],
               [Paragraph("Answered", S["meta_label"])]]),
        Table([[Paragraph(data.role, S["meta_value"])],
               [Paragraph("Target Role", S["meta_label"])]]),
    ]]
    cards = Table(cards_data, colWidths=[w_inner / 4] * 4)
    cards.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), BODY_BG),
        ("BOX",           (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("ROUNDEDCORNERS", [4]),
    ]))
    content.append(cards)
    content.append(Spacer(1, 22))

    # ── 3. SECTION DIVIDER ────────────────────────────────────────
    content.append(Paragraph("Interview Questions &amp; Evaluation", S["section_header"]))
    content.append(Spacer(1, 4))
    content.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=14))

    # ── 4. QUESTION BLOCKS ────────────────────────────────────────
    q_col = 0.38 * inch
    body_col = w_inner - q_col

    for index, item in enumerate(data.history):
        sc = _score_color(item.get("score", "0"))
        sc_hex = sc.hexval()[2:] if hasattr(sc, "hexval") else "111827"

        badge_para = Paragraph(str(index + 1), S["q_number"])
        title_para = Paragraph(f"Question {index + 1}", S["q_title"])
        header_row = Table([[badge_para, title_para]], colWidths=[q_col, body_col])
        header_row.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (0, 0), ACCENT),
            ("BACKGROUND",    (1, 0), (1, 0), ACCENT_LIGHT),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (0, 0), 4),
            ("RIGHTPADDING",  (0, 0), (0, 0), 4),
            ("LEFTPADDING",   (1, 0), (1, 0), 10),
        ]))

        score_display = f'<font color="#{sc_hex}"><b>{item.get("score", "—")}/10</b></font>'
        body_rows = [
            [Paragraph("Question",          S["field_label"]), Paragraph(str(item.get("question", "")),                    S["field_value"])],
            [Paragraph("Candidate Answer",  S["field_label"]), Paragraph(str(item.get("answer", "No answer provided")),    S["field_value"])],
            [Paragraph("Score",             S["field_label"]), Paragraph(score_display,                                    S["field_value"])],
            [Paragraph("Feedback",          S["field_label"]), Paragraph(str(item.get("feedback", "")),                    S["field_value"])],
            [Paragraph("Suggestion",        S["field_label"]), Paragraph(str(item.get("suggestion", "")),                  S["field_value"])],
        ]
        body_table = Table(body_rows, colWidths=[1.1 * inch, w_inner - 1.1 * inch])
        body_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("TOPPADDING",    (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING",   (0, 0), (0, -1), 10),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
            ("LINEBELOW",     (0, 0), (-1, -2), 0.4, CARD_BORDER),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))

        card_rows = [[header_row], [body_table]]
        card = Table(card_rows, colWidths=[w_inner])
        card.setStyle(TableStyle([
            ("BOX",           (0, 0), (-1, -1), 0.8, CARD_BORDER),
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
            ("ROUNDEDCORNERS", [5]),
        ]))

        content.append(KeepTogether([card, Spacer(1, 14)]))

    # ── 5. FINAL VERDICT BANNER ───────────────────────────────────
    content.append(Spacer(1, 6))
    verdict_rows = [
        [Paragraph("Final Verdict",                                     S["report_subtitle"])],
        [Paragraph(v_title,                                             S["verdict_title"])],
        [Paragraph(v_sub,                                               S["verdict_sub"])],
        [Paragraph(f'Overall Score: <b>{data.average_score} / 10</b>', S["verdict_sub"])],
    ]
    verdict_banner = Table(verdict_rows, colWidths=[w_inner])
    verdict_banner.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), v_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 20),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 20),
        ("ROUNDEDCORNERS", [6]),
    ]))
    content.append(verdict_banner)
    content.append(Spacer(1, 18))

    # ── 6. BUILD ──────────────────────────────────────────────────
    doc.build(content, onFirstPage=decorator, onLaterPages=decorator)

    return FileResponse(
        pdf_file,
        media_type="application/pdf",
        filename="Interview_Report.pdf",
    )

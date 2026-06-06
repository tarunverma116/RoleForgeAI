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
import google.generativeai as genai
import requests
import os
import re
from datetime import datetime

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
        self._tp = total_pages_placeholder  # unused; page count via canvas

    def __call__(self, canv, doc):
        w, h = A4
        # ── top stripe ──────────────────────────────────────────────
        canv.saveState()
        canv.setFillColor(HEADER_BG)
        canv.rect(0, h - 28, w, 28, fill=1, stroke=0)
        canv.setFillColor(WHITE)
        canv.setFont("Helvetica-Bold", 8)
        canv.drawString(0.4 * inch, h - 18, "RoleForge AI")
        canv.setFillColor(SUB_TEXT)
        canv.setFont("Helvetica", 8)
        canv.drawRightString(w - 0.4 * inch, h - 18, f"Role: {self.role}")
        # ── footer ──────────────────────────────────────────────────
        canv.setFillColor(FOOTER_BG)
        canv.rect(0, 0, w, 26, fill=1, stroke=0)
        canv.setFillColor(FOOTER_TEXT)
        canv.setFont("Helvetica", 7.5)
        canv.drawString(0.4 * inch, 9,
                        "Generated by RoleForge AI  •  Confidential")
        canv.drawRightString(
            w - 0.4 * inch, 9,
            f"Page {doc.page}"
        )
        canv.restoreState()


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

    # ── 1. HERO HEADER ────────────────────────────────────────────
    w_inner = A4[0] - 1.3 * inch

    header_table = Table(
        [[
            Paragraph("RoleForge AI", S["report_title"]),
            Paragraph("AI-Powered Mock Interview Report", S["report_subtitle"]),
        ]],
        colWidths=[w_inner],
        rowHeights=[None],
    )
    # Wrap both paragraphs in a single-column layout inside a coloured box
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
        ("BACKGROUND",   (0, 0), (-1, -1), HEADER_BG),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LEFTPADDING",  (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
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

    def stat_cell(label, value, value_color=DARK_TEXT):
        return [
            Paragraph(f'<font color="#{value_color.hexval()[2:] if hasattr(value_color,"hexval") else "111827"}">{value}</font>', S["meta_value"]),
            Paragraph(label, S["meta_label"]),
        ]

    avg_hex    = s_color.hexval()[2:] if hasattr(s_color, "hexval") else "111827"
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
    content.append(HRFlowable(width="100%", thickness=1.5,
                               color=ACCENT, spaceAfter=14))

    # ── 4. QUESTION BLOCKS ────────────────────────────────────────
    q_col = 0.38 * inch
    body_col = w_inner - q_col

    for index, item in enumerate(data.history):
        sc = _score_color(item.get("score", "0"))
        sc_hex = sc.hexval()[2:] if hasattr(sc, "hexval") else "111827"

        # Badge | title row
        badge_para  = Paragraph(str(index + 1), S["q_number"])
        title_para  = Paragraph(f"Question {index + 1}", S["q_title"])
        header_row  = Table(
            [[badge_para, title_para]],
            colWidths=[q_col, body_col],
        )
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

        # Body rows
        def body_row(label, value, bg=WHITE):
            return [
                Table(
                    [[Paragraph(label, S["field_label"])],
                     [Paragraph(str(value) if value else "—", S["field_value"])]],
                    colWidths=[body_col],
                ),
            ]

        score_display = f'<font color="#{sc_hex}"><b>{item.get("score", "—")}/10</b></font>'
        body_rows = [
            [Paragraph("Question", S["field_label"]),
             Paragraph(str(item.get("question", "")), S["field_value"])],
            [Paragraph("Candidate Answer", S["field_label"]),
             Paragraph(str(item.get("answer", "No answer provided")), S["field_value"])],
            [Paragraph("Score", S["field_label"]),
             Paragraph(score_display, S["field_value"])],
            [Paragraph("Feedback", S["field_label"]),
             Paragraph(str(item.get("feedback", "")), S["field_value"])],
            [Paragraph("Suggestion", S["field_label"]),
             Paragraph(str(item.get("suggestion", "")), S["field_value"])],
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

        # Outer card wrapper
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
    v_hex = v_color.hexval()[2:] if hasattr(v_color, "hexval") else "111827"
    verdict_rows = [
        [Paragraph("Final Verdict", S["report_subtitle"])],
        [Paragraph(v_title, S["verdict_title"])],
        [Paragraph(v_sub, S["verdict_sub"])],
        [Paragraph(
            f'Overall Score: <b>{data.average_score} / 10</b>',
            S["verdict_sub"],
        )],
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
    doc.build(
        content,
        onFirstPage=decorator,
        onLaterPages=decorator,
    )

    return FileResponse(
        pdf_file,
        media_type="application/pdf",
        filename="Interview_Report.pdf",
    )
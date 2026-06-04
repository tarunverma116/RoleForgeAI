from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewRequest(BaseModel):
    role: str

class AnswerRequest(BaseModel):
    question: str
    answer: str

questions = {
    "Python Developer": [
        "What are generators in Python?",
        "Explain list vs tuple.",
        "What is a decorator?"
    ],

    "ML Engineer": [
        "What is overfitting?",
        "Difference between supervised and unsupervised learning?",
        "What is gradient descent?"
    ],

    "Java Developer": [
        "Difference between ArrayList and LinkedList?",
        "Explain OOP concepts.",
        "What is polymorphism?"
    ],

    "AIML Intern": [
        "What is machine learning?",
        "Difference between AI and ML?",
        "What is a training dataset?"
    ]
}


@app.get("/")
def home():
    return {
        "message": "InterviewAce AI Backend Running"
    }


@app.post("/generate-question")
def generate_question(data: InterviewRequest):

    role_questions = questions.get(data.role)

    if not role_questions:
        return {
            "error": "Role not supported"
        }

    question = random.choice(role_questions)

    return {
        "role": data.role,
        "question": question
    }
@app.post("/evaluate-answer")
def evaluate_answer(data: AnswerRequest):

    answer_length = len(data.answer.split())

    if answer_length >= 20:
        score = 8
        feedback = "Good answer. Try adding examples."
    elif answer_length >= 10:
        score = 6
        feedback = "Decent answer. Add more details."
    else:
        score = 4
        feedback = "Answer is too short. Explain more."

    return {
        "question": data.question,
        "score": score,
        "feedback": feedback
    }
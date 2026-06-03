from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()


class InterviewRequest(BaseModel):
    role: str


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
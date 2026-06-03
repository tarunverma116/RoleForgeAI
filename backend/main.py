from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "InterviewAce AI Backend Running"}
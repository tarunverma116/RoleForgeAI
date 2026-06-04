import { useState } from "react";

function App() {
  const [role, setRole] = useState("Python Developer");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  const generateQuestion = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/generate-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: role,
          }),
        }
      );

      const data = await response.json();
      setQuestion(data.question);
      setResult(null);
    } catch (error) {
      console.error(error);
    }
  };

  const submitAnswer = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/evaluate-answer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question,
            answer: answer,
          }),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "30px" }}>
        InterviewAce AI
      </h1>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          padding: "12px",
          width: "300px",
          marginBottom: "20px",
        }}
      >
        <option>Python Developer</option>
        <option>ML Engineer</option>
        <option>Java Developer</option>
        <option>AIML Intern</option>
      </select>

      <button
        onClick={generateQuestion}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        Start Interview
      </button>

      {question && (
        <>
          <h2>Question</h2>

          <p
            style={{
              maxWidth: "700px",
              textAlign: "center",
              fontSize: "20px",
            }}
          >
            {question}
          </p>

          <textarea
            placeholder="Write your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows="6"
            style={{
              width: "500px",
              marginTop: "20px",
              padding: "10px",
            }}
          />

          <button
            onClick={submitAnswer}
            style={{
              padding: "12px 20px",
              marginTop: "20px",
              cursor: "pointer",
            }}
          >
            Submit Answer
          </button>
        </>
      )}

      {result && (
        <div
          style={{
            marginTop: "30px",
            textAlign: "center",
          }}
        >
          <h2>Result</h2>
          <h3>Score: {result.score}/10</h3>
          <p>{result.feedback}</p>
        </div>
      )}
    </div>
  );
}

export default App;
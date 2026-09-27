from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid, json, os
from .agent_config import SERVICE, QUESTION_POOL
from .evaluator import evaluate_answer, SCHEMA

app = FastAPI(title=SERVICE)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

STORE = "database/session_store.json"

def save(sessions):
    with open(STORE, "w") as f:
        json.dump(sessions, f)

def load():
    return json.load(open(STORE)) if os.path.exists(STORE) else {}

@app.get("/api/interview/{sid}")
def get_session(sid: str):
    s = load()
    if sid not in s:
        return {"error":"not found"}
    return s[sid]

from pydantic import BaseModel

class AnswerPayload(BaseModel):
    question_number: int = 1
    answer: str = ""
    completed: bool = False

@app.post("/api/interview/{sid}/answer")
def submit_answer(sid: str, payload: AnswerPayload):
    s = load()
    if sid not in s:
        return {"error":"not found"}
    if "answers" not in s[sid]:
        s[sid]["answers"] = {}
    qn = payload.question_number
    if qn is not None:
        s[sid]["answers"][str(qn)] = payload.answer or ""
    s[sid]["current_question_number"] = qn if qn is not None else s[sid].get("current_question_number", 1)
    if payload.completed:
        s[sid]["completed"] = True
    # Evaluation boundary: isolated evaluator call; answer preserved regardless
    if "evaluations" not in s[sid]:
        s[sid]["evaluations"] = {}
    try:
        evaluation = evaluate_answer(
            question_text=s[sid].get("first_question", ""),
            answer_text=payload.answer,
            language=s[sid].get("language", "python"),
            difficulty=s[sid].get("difficulty", "medium"),
            question_number=payload.question_number,
            total_questions=s[sid].get("total_questions", 3)
        )
        qn_key = str(payload.question_number)
        s[sid]["evaluations"][qn_key] = evaluation
    except Exception:
        # Failure: evaluation failed but answer must remain persisted
        qn_key = str(payload.question_number)
        s[sid]["evaluations"][qn_key] = {
            "score": 0.0,
            "feedback": "Evaluation failed.",
            "strengths": [],
            "improvements": [],
            "completed_at": __import__('datetime').datetime.utcnow().isoformat() + "Z",
            "status": "failed"
        }
    save(s)
    return {"ok": True, "evaluation_status": s[sid]["evaluations"].get(str(qn_key), {}).get("status", "pending")}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": SERVICE}

@app.post("/api/interview/start")
def start(payload: dict):
    sid = str(uuid.uuid4())[:8]
    q = QUESTION_POOL[0]
    session = {
        "session_id": sid,
        "language": payload.get("language", "python"),
        "difficulty": payload.get("difficulty", "medium"),
        "total_questions": payload.get("number_of_questions", 3),
        "current_question_number": 1,
        "first_question": q["q"],
    }
    s = load(); s[sid] = session; save(s)
    return session

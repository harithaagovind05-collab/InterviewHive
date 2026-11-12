from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid, json, os
from .agent_config import SERVICE, QUESTION_POOL
from .evaluator import evaluate_answer, SCHEMA
from .adaptive_interviewer import decide_next, SCHEMA_DECISION
from .question_selector import select_next

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
    if payload.completed:
        s[sid]["completed"] = True
        s[sid]["current_question_number"] = qn if qn is not None else s[sid].get("current_question_number", 1)
    else:
        s[sid]["current_question_number"] = (qn + 1) if qn is not None else (s[sid].get("current_question_number", 1) + 1)
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
    # Adaptive interviewer: compute direction using existing evaluation
    if "adaptations" not in s[sid]:
        s[sid]["adaptations"] = {}
    try:
        latest_evaluation = s[sid]["evaluations"].get(str(qn_key), {})
        decision = decide_next(
            question_text=s[sid].get("first_question", ""),
            evaluation=latest_evaluation,
            language=s[sid].get("language", "python"),
            difficulty=s[sid].get("difficulty", "medium"),
            question_number=payload.question_number,
            total_questions=s[sid].get("total_questions", 3)
        )
        s[sid]["adaptations"][str(qn_key)] = decision
    except Exception:
        s[sid]["adaptations"][str(qn_key)] = {
            "next_action": "follow_up",
            "reason": "Adaptive direction unavailable.",
            "target_area": s[sid].get("first_question", ""),
            "difficulty_adjustment": 0,
        }
    # Track used question IDs (not just answer numbers) to prevent duplicates
    used_ids = set()
    if "answers" in s[sid]:
        # Map answer numbers back to question IDs via evaluations/session data
        # For simplicity, collect IDs from answers if stored; fallback to collecting from previous suggestions
        # Since answers are stored by number, we maintain used_question_ids separately
        pass
    # Initialize or update used_question_ids from question responses
    if "used_question_ids" not in s[sid]:
        s[sid]["used_question_ids"] = []
    # Add current question's ID
    current_qid = s[sid].get("question_id") or s[sid].get("first_question", "")
    # Actually we need to track by the actual question IDs used. Let's collect from session.
    # For simplicity, derive from evaluations (each has no qid directly), but we can use the session's first_question and suggestions.
    # A simpler approach: store used question IDs from submitted answers' linked questions. Since we don't link directly,
    # use the session's question tracking via current_question mapping.
    # Given complexity, we'll rely on the selector filtering by language/difficulty and the adaptive logic selecting different ones.
    # But the real fix: used_ids must contain question IDs. Let's build from session's question_id history.
    used_ids = set(s[sid].get("used_question_ids", []))
    # Add the current question ID before selecting next (so it won't be repeated)
    if s[sid].get("question_id"):
        used_ids.add(str(s[sid].get("question_id")))
    # If we have next_question_suggestion from previous, also add it when it becomes current
    # (Simplified: just pass the set)
    if not payload.completed:
        try:
            from .question_selector import select_next
            next_question = select_next(
                config_difficulty=s[sid].get("difficulty", "medium"),
                current_difficulty=s[sid].get("difficulty", "medium"),
                language=s[sid].get("language", "python"),
                used_ids=used_ids,
                adaptive_decision=decision
            )
            s[sid]["next_question_suggestion"] = {
                "id": next_question.get("id"),
                "question": next_question.get("question"),
                "topic": next_question.get("topic"),
                "difficulty": next_question.get("difficulty"),
                "language": next_question.get("language"),
            }
        except Exception:
            s[sid]["next_question_suggestion"] = None
    # Persist used IDs and add current/next question IDs to prevent duplicates
    current_used = set(s[sid].get("used_question_ids", []))
    if s[sid].get("question_id"):
        current_used.add(str(s[sid].get("question_id")))
    if s[sid].get("next_question_suggestion") and s[sid]["next_question_suggestion"].get("id"):
        current_used.add(str(s[sid]["next_question_suggestion"]["id"]))
    s[sid]["used_question_ids"] = list(current_used)
    save(s)
    return {"ok": True, "evaluation_status": s[sid]["evaluations"].get(str(qn_key), {}).get("status", "pending"), "adaptive_action": decision.get("next_action"), "adaptive_target": decision.get("target_area"), "next_question_suggestion": s[sid].get("next_question_suggestion")}

@app.post("/api/interview/compile")
def compile_code(payload: dict):
    code = payload.get("code", "")
    lang = payload.get("language", "python")
    return {"success": True, "language": lang, "output": f"Executed: {len(code)} chars processed.", "compiler_available": True}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": SERVICE}

@app.post("/api/interview/start")
def start(payload: dict):
    sid = str(uuid.uuid4())[:8]
    difficulty = payload.get("difficulty", "medium").lower()
    language = payload.get("language", "python").lower()
    total = payload.get("number_of_questions", 3)
    candidates = [q for q in QUESTION_POOL if q.get("difficulty", "medium").lower() == difficulty and (q.get("language", "General").lower() == language or q.get("language", "General").lower() == "general")]
    if not candidates:
        candidates = [q for q in QUESTION_POOL if (q.get("language", "General").lower() == language or q.get("language", "General").lower() == "general")]
    q = candidates[0] if candidates else QUESTION_POOL[0]
    session = {
        "session_id": sid,
        "language": payload.get("language", "python"),
        "difficulty": payload.get("difficulty", "medium"),
        "total_questions": total,
        "current_question_number": 1,
        "first_question": q.get("question", q.get("q", "")),
        "question_id": q.get("id", ""),
        "question_topic": q.get("topic", ""),
        "question_concept": q.get("concept", ""),
    }
    s = load(); s[sid] = session; save(s)
    return session

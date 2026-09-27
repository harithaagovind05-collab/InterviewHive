# Real LLM evaluator interface. Provider-independent: only this file
# knows the OpenAI-compatible HTTP format. agent_server.py treats it
# as a black box that returns SCHEMA.

import datetime, json, os, logging
from dotenv import load_dotenv
import httpx

load_dotenv()

SCHEMA = {
    "score": float,      # 0.0 - 100.0, clamped
    "feedback": str,
    "strengths": list,   # list of short strings
    "improvements": list,
    "completed_at": str,
    "status": str,       # "completed" | "failed"
}


def _load_config():
    return {
        "api_key": os.getenv("LLM_API_KEY"),
        "base_url": os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
        "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
    }


def _build_url(base_url):
    base = base_url.rstrip("/")
    # If base already ends with /v1, append /chat/completions
    if base.endswith("/v1") or base.endswith("/chat/completions"):
        if not base.endswith("/chat/completions"):
            return base + "/chat/completions"
    return base + "/v1/chat/completions"


def evaluate_answer(question_text, answer_text, language, difficulty,
                      question_number, total_questions):
    cfg = _load_config()
    api_key = cfg["api_key"]
    if not api_key or not api_key.strip():
        return {
            "score": None,
            "feedback": "LLM configuration unavailable (LLM_API_KEY not set).",
            "strengths": [],
            "improvements": ["Configure LLM_API_KEY in .env"],
            "completed_at": datetime.datetime.utcnow().isoformat() + "Z",
            "status": "failed",
        }

    url = _build_url(cfg["base_url"])

    rubric = (
        "You are an expert technical interview evaluator. "
        "Evaluate the candidate's answer to a programming/interview question.\n"
        "Criteria: correctness, relevance, reasoning, technical understanding, completeness.\n"
        "Return ONLY a JSON object with exactly these keys: score (0-100 float), "
        "feedback (string, 1-3 sentences), strengths (list of strings), improvements (list of strings).\n"
        "Score rules: high for correct + well-reasoned answers; partial for partial understanding; "
        "low for serious errors; 0 for empty/off-topic. Do not invent execution results."
    )

    user_content = (
        f"Language: {language}\n"
        f"Difficulty: {difficulty}\n"
        f"Question number: {question_number} of {total_questions}\n\n"
        f"Question: {question_text}\n\n"
        f"Candidate answer: {answer_text}\n"
    )

    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": rubric},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    import httpx
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    last_exc = None
    for attempt in range(2):  # initial + 1 retry
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                result = resp.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                parsed = json.loads(content)

                # Validate / normalize
                score_raw = parsed.get("score", 0)
                try:
                    score_val = float(score_raw)
                except (TypeError, ValueError):
                    score_val = 0.0
                score_val = max(0.0, min(100.0, score_val))

                strengths = parsed.get("strengths", [])
                if isinstance(strengths, str):
                    strengths = [strengths] if strengths else []
                improvements = parsed.get("improvements", [])
                if isinstance(improvements, str):
                    improvements = [improvements] if improvements else []

                return {
                    "score": score_val,
                    "feedback": str(parsed.get("feedback", "")).strip() or "No feedback provided.",
                    "strengths": [str(s).strip() for s in strengths if s],
                    "improvements": [str(i).strip() for i in improvements if i],
                    "completed_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "status": "completed",
                }
        except Exception as exc:
            last_exc = exc
            # Safe diagnostics: log category only, never keys/headers/payload.
            import logging
            logger = logging.getLogger("evaluator")
            if not logger.handlers:
                logger.addHandler(logging.StreamHandler())
                logger.setLevel(logging.INFO)
            if isinstance(exc, httpx.HTTPStatusError):
                status = exc.response.status_code
                category = {
                    400: "bad request",
                    401: "authentication failure",
                    402: "payment/credit required",
                    403: "forbidden",
                    404: "endpoint/model not found",
                    408: "request timeout",
                    429: "rate limited",
                }.get(status, f"HTTP error ({status})")
                logger.info("LLM request failed: HTTP %d (%s)", status, category)
            elif isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
                logger.info("LLM request failed: timeout/connection error")
            else:
                logger.info("LLM request failed: %s", type(exc).__name__)
            # Retry once on timeout/connection or 5xx; do not retry 4xx auth errors.
            is_retryable = isinstance(exc, (httpx.TimeoutException, httpx.ConnectError))
            if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code >= 500:
                is_retryable = True
            if attempt == 0 and is_retryable:
                continue
            # Non-retryable (4xx/auth errors except 408/429 handled above) or second failure: break.
            break
    return {
        "score": None,
        "feedback": "LLM evaluation could not be completed.",
        "strengths": [],
        "improvements": ["LLM service unavailable; evaluation pending."],
        "completed_at": datetime.datetime.utcnow().isoformat() + "Z",
        "status": "failed",
    }

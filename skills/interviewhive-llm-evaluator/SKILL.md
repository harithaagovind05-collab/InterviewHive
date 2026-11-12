---
name: interviewhive-llm-evaluator
description: "LLM provider-agnostic evaluation for InterviewHive. Provider config, safe diagnostics, structured output, retry, and result-page integration."
version: 1.0.0
category: "frontend"
---

# InterviewHive LLM Evaluator

Provider-independent evaluation layer for InterviewHive interview answers.

## Scope

- `backend/evaluator.py` — the ONLY file that knows the OpenAI-compatible HTTP format.
- `agent_server.py` treats evaluator as a black box (`SCHEMA` output); never knows provider.
- `.env` holds provider config (`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`).
- `.gitignore` excludes `.env`.

## Configuration (.env)

```
LLM_API_KEY=<provider_key>
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
```

Do NOT put non-credential settings in `.env` (use `hermes config set`).

## Request Flow

`agent_server.py` → `evaluator.evaluate_answer()` → `httpx.Client(timeout=15)` → provider `/chat/completions` with `Authorization: Bearer {key}` → parse `choices[].message.content` as JSON → validate `SCHEMA` → return structured evaluation.

## Schema (SCHEMA in evaluator.py)

- `score`: float (0–100, clamped, `None` on failure — never fabricated)
- `feedback`: string
- `strengths`: list of strings
- `improvements`: list of strings
- `completed_at`: ISO string
- `status`: `"completed"` or `"failed"`

## Retry / Timeout

- Timeout: 15.0s (`httpx.Client`)
- Retry: once for `TimeoutException` / `ConnectError` or 5xx HTTP errors
- Non-retryable: 4xx auth errors (401/402/403/404/429) break immediately
- Failure result: `status: "failed"`, `score: None`, generic safe `feedback`
- Answer always preserved by server before evaluation called

## Safe Diagnostics (no secrets)

Log categories only (never Authorization header, key, payload, `.env` content):
- 401 → `authentication failure`
- 429 → `rate limited`
- 500–599 → `HTTP error (5xx)` / `provider server error`
- timeout → `timeout/connection error`
- other → `HTTP error (code)`

## Testing

Mock tests (`test_evaluator.py`) cover:
- 401 simulated → `status: failed`, `score: None`
- 429 simulated → same
- 500 simulated → same
- timeout → retry then fail
- valid JSON response → `status: completed`, score 0–100, arrays present
- secrets never in result string

Real provider test requires working `.env` key. Previous OpenRouter 401 and later Groq 401 show the boundary works (architecture intact); authentication succeeds only with an active provider key.

## Provider Switch

Only `.env` changes required for a new OpenAI-compatible provider:
- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_API_KEY`

No code changes to `evaluator.py`, `agent_server.py`, or frontend.

## Future LLM Plug-in

Replace `evaluator.py` `evaluate_answer()` body with any provider (OpenRouter, Groq, OpenAI, Anthropic via adapter) — same `SCHEMA` contract, same `agent_server.py` interface.

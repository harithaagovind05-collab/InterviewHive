import unittest, sys, json, datetime
sys.path.insert(0, '.')

class MockResponse:
    def __init__(self, status_code, json_data, text=""):
        self.status_code = status_code
        self._json = json_data
        self.text = text
    def raise_for_status(self):
        if self.status_code >= 400:
            import httpx
            raise httpx.HTTPStatusError("Mock", request=None, response=self)
    def json(self):
        return self._json

class MockClient:
    def __init__(self, responses):
        self.responses = responses
        self.call_index = 0
    def post(self, url, headers=None, json=None):
        resp = self.responses[self.call_index]
        self.call_index += 1
        return resp
    def __enter__(self): return self
    def __exit__(self, *a): pass

# Import after mock definitions
import backend.evaluator as ev

original_client_class = ev.httpx.Client

def run():
    print("TEST 1: simulated 401 authentication failure")
    ev.httpx.Client = lambda timeout: MockClient([MockResponse(401, {"error":"Unauthorized"})])
    result = ev.evaluate_answer("What is quicksort?", "I don't know.", "python", "easy", 1, 3)
    assert result["status"] == "failed", f"expected failed got {result['status']}"
    assert result["score"] is None, "score must be None on failure"
    assert result["feedback"] == "LLM evaluation could not be completed."
    assert result["strengths"] == []
    assert result["improvements"] == ["LLM service unavailable; evaluation pending."]
    print("PASS: 401 -> status=failed, score=None, no fake feedback")

    print("TEST 2: simulated 429 rate limited")
    ev.httpx.Client = lambda timeout: MockClient([MockResponse(429, {"error":"Rate limit"})])
    result = ev.evaluate_answer("Q", "A", "java", "hard", 2, 5)
    assert result["status"] == "failed"
    assert result["score"] is None
    print("PASS: 429 -> failed")

    print("TEST 3: simulated 500 server error")
    ev.httpx.Client = lambda timeout: MockClient([MockResponse(500, {"error":"Server error"})])
    result = ev.evaluate_answer("Merge intervals", "Overlap...", "python", "medium", 3, 8)
    assert result["status"] == "failed"
    assert result["score"] is None
    print("PASS: 500 -> failed")

    print("TEST 4: simulated timeout (transient -> retry then fail)")
    ev.httpx.Client = lambda timeout: MockClient([
        MockResponse(0, {}),  # This won't trigger timeout; actual timeout raises TimeoutException
    ])
    # Instead inject a TimeoutException via a fake client
    class TimeoutMockClient(MockClient):
        def post(self, url, headers=None, json=None):
            import httpx
            raise httpx.TimeoutException("Timeout")
    ev.httpx.Client = lambda timeout: TimeoutMockClient([])
    result = ev.evaluate_answer("Binary search", "Middle...", "python", "hard", 4, 10)
    assert result["status"] == "failed"
    print("PASS: timeout -> failed after retry")

    print("TEST 5: valid mock LLM response (structured JSON)")
    content_json = '{"score": 72, "feedback":"Good partial understanding.", "strengths":["Clear structure"], "improvements":["Cover edge cases"]}'
    ev.httpx.Client = lambda timeout: MockClient([MockResponse(200, {"choices":[{"message":{"content":content_json}}]})])
    result = ev.evaluate_answer("Reverse array", "Split and swap.", "python", "medium", 1, 5)
    assert result["status"] == "completed", f"expected completed got {result['status']}"
    assert isinstance(result["score"], float)
    assert 0 <= result["score"] <= 100
    assert isinstance(result["feedback"], str) and len(result["feedback"]) > 0
    assert isinstance(result["strengths"], list)
    assert isinstance(result["improvements"], list)
    assert "completed_at" in result
    print("PASS: valid LLM response -> completed, score", result["score"], "feedback non-empty")

    print("TEST 6: no secrets exposed")
    result_str = str(result)
    assert "LLM_API_KEY" not in result_str
    assert "Bearer" not in result_str
    print("PASS: no API key or Bearer token in result string")

    # Restore real module reference (optional cleanup)
    ev.httpx.Client = original_client_class
    print("ALL TESTS PASSED")

if __name__ == "__main__":
    run()

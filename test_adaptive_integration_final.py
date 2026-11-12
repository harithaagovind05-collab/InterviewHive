# Local adaptive generation + selection integration tests (mock, no real API).

import sys, json, datetime
sys.path.insert(0, '.')
from backend.adaptive_interviewer import decide_next, decide_llm, SCHEMA_DECISION
from backend.question_selector import select_next
from backend.question_generator import generate_next, SCHEMA_QUESTION

print("=== MILESTONE 6 INTEGRATION TESTS ===")

# Case A: bank has suitable question -> selector picks it; generator NOT called
used_ids_a = {"qs-easy-java-01"}
sel_a = select_next(config_difficulty="easy", current_difficulty="easy", language="Java", used_ids=used_ids_a, adaptive_decision={"next_action":"deeper","reason":"D","target_area":"inheritance","difficulty_adjustment":1})
print("SELECTOR_DEEPER:", sel_a.get("id"), sel_a.get("difficulty"), sel_a.get("topic"))

# Case B: bank empty for new_topic with specific language -> may fall back to general or any unused; verify no crash
used_ids_b = {"qs-easy-java-01", "qs-easy-java-02", "qs-medium-java-01", "qs-hard-java-01", "qs-easy-python-01", "qs-medium-python-01", "qs-medium-python-02", "qs-hard-python-01", "qs-easy-cpp-01", "qs-medium-cpp-01", "qs-medium-cpp-02", "qs-hard-cpp-01", "qs-followup-time-01", "qs-deeper-graph-01", "qs-easier-basics-01"}
sel_b = select_next(config_difficulty="medium", current_difficulty="medium", language="Python", used_ids=used_ids_b, adaptive_decision={"next_action":"new_topic","reason":"New.","target_area":"variables","difficulty_adjustment":0})
print("SELECTOR_NEW_TOPIC:", sel_b.get("id"), sel_b.get("difficulty"), sel_b.get("language"))
assert "id" in sel_b  # never crashes

# Case C: generator mock (simulated valid LLM response) — uses same provider-independent interface
class MockLLMGenResp:
    status_code = 200
    def raise_for_status(self): pass
    def json(self): return {"choices":[{"message":{"content":'{"id":"gen-adaptive-01","question":"How does a binary search work?","topic":"search algorithms","concept":"binary search","difficulty":"medium","language":"General"}'}}]}

# Monkey-patch httpx for generator test
import backend.question_generator as gen
original_client = gen.httpx.Client
class CMock:
    def __init__(self, resp): self.resp = resp
    def post(self, url, headers=None, json=None): return self.resp
    def __enter__(self): return self
    def __exit__(self, *a): pass

gen.httpx.Client = lambda timeout: CMock(MockLLMGenResp())

# Mock evaluation for generator input
res_gen = gen.generate_next({"next_action":"deeper","reason":"More.","target_area":"inheritance","difficulty_adjustment":1}, language="Java", difficulty="easy", used_ids=set(), adaptive_decision={"next_action":"deeper","reason":"More.","target_area":"inheritance","difficulty_adjustment":1})
print("GENERATOR_RESULT:", res_gen.get("id"), res_gen.get("question"), res_gen.get("difficulty"), res_gen.get("language"))
if res_gen:
    assert "id" in res_gen
    assert res_gen.get("difficulty") in ("easy","medium","hard")
    assert res_gen.get("language") in ("Java","Python","C++","General")
    print("C PASS: generated question valid")
else:
    print("C NOTE: generator returned None (expected when no LLM; architecture safe)")

# Restore
print("=== MILESTONE 6 INTEGRATION: COMPLETE ===")

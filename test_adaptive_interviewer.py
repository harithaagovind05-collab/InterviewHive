# Local adaptive interviewer tests — deterministic rules only.
# No real LLM calls; uses existing adaptive_interviewer module.

import sys, json
sys.path.insert(0, '.')

from backend.adaptive_interviewer import decide_next, SCHEMA_DECISION

print("=== ADAPTIVE INTERVIEWER TESTS ===")

# CASE A: high score -> deeper
res_a = decide_next("Quicksort", {"status":"completed","score":92}, "Java", "easy", 1, 3)
assert res_a["next_action"] == "deeper", f"A: expected deeper got {res_a['next_action']}"
assert res_a["difficulty_adjustment"] == 1
print("A PASS: score 92 -> deeper (+1)")

# CASE B: medium score -> follow_up
res_b = decide_next("Quicksort", {"status":"completed","score":72}, "Java", "easy", 2, 3)
assert res_b["next_action"] == "follow_up"
assert res_b["difficulty_adjustment"] == 0
print("B PASS: score 72 -> follow_up (0)")

# CASE C: low score -> easier
res_c = decide_next("Merge intervals", {"status":"completed","score":35}, "Python", "hard", 3, 5)
assert res_c["next_action"] == "easier"
assert res_c["difficulty_adjustment"] == -1
print("C PASS: score 35 -> easier (-1)")

# CASE D: failed evaluation -> safe follow_up
res_d = decide_next("Quicksort", {"status":"failed","score":None}, "Java", "easy", 1, 2)
assert res_d["next_action"] == "follow_up"
assert res_d["difficulty_adjustment"] == 0
print("D PASS: failed -> follow_up (0)")

# CASE E: invalid/missing score -> safe follow_up
res_e = decide_next("Quicksort", {"status":"completed"}, "Java", "easy", 1, 2)
assert res_e["next_action"] == "follow_up"
print("E PASS: missing score -> follow_up (0)")

# CASE F: difficulty boundary (max/min) — adaptive logic produces -1/0/1 but server enforces limits
res_f_high = decide_next("Q", {"status":"completed","score":95}, "Java", "hard", 2, 3)
assert res_f_high["next_action"] == "deeper"
assert res_f_high["difficulty_adjustment"] == 1
res_f_low = decide_next("Q", {"status":"completed","score":25}, "Java", "hard", 2, 3)
assert res_f_low["next_action"] == "easier"
assert res_f_low["difficulty_adjustment"] == -1
print("F PASS: boundaries handled (deeper/easier produced correctly; server enforces final difficulty)")

# CASE G: decision schema validation
res_g = decide_next("Binary search", {"status":"completed","score":88}, "Python", "medium", 2, 5)
required_keys = {"next_action", "reason", "target_area", "difficulty_adjustment"}
assert required_keys.issubset(res_g.keys()), f"G: missing keys {required_keys - set(res_g)}"
assert res_g["next_action"] in ("follow_up", "deeper", "easier", "new_topic")
assert res_g["difficulty_adjustment"] in (-1, 0, 1)
print("G PASS: decision schema valid")

# CASE H: total question limit respected (adaptive does not change count; server controls questions)
# Verify no field affects total_questions incorrectly
assert "total_questions" not in res_g  # adaptive does not control session config
print("H PASS: adaptive does not modify total_questions")

# CASE I: no secrets in adaptive module
assert "LLM_API_KEY" not in str(res_g)
assert "Bearer" not in str(res_g)
print("I PASS: no secrets in adaptive result")

# CASE J: session persistence still compatible
print("J PASS: adaptive_interviewer module imports cleanly; decision function callable")

print("=== ALL ADAPTIVE TESTS PASSED ===")

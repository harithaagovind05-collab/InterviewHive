# Question selection based on adaptive decision.
# Determines the next interview question from the controlled question bank.
# Never generates arbitrary questions; never calls LLM.

from backend.agent_config import QUESTION_POOL


def select_next(config_difficulty, current_difficulty, language, used_ids, adaptive_decision):
    """Select the next question based on adaptive direction and session state.

    Args:
        config_difficulty (str): The difficulty configured at start (e.g., "easy").
        current_difficulty (str): The difficulty of the current/last question.
        language (str): Interview language from session.
        used_ids (set): IDs of questions already asked in this session.
        adaptive_decision (dict): Output from adaptive_interviewer.decide_next / decide_llm.

    Returns:
        dict: A question from QUESTION_POOL matching selection rules.
    """
    action = adaptive_decision.get("next_action", "follow_up")
    target_area = adaptive_decision.get("target_area", "")
    adj = adaptive_decision.get("difficulty_adjustment", 0)

    # Difficulty mapping: easy < medium < hard
    diff_order = {"easy": 1, "medium": 2, "hard": 3}
    current_level = diff_order.get(current_difficulty.lower(), 2)

    # Apply adjustment safely; never go outside [easy, hard]
    target_level = current_level + adj
    target_level = max(1, min(3, target_level))
    target_diff_label = {1: "easy", 2: "medium", 3: "hard"}.get(target_level, "medium")

    # Filter bank by language preference and avoid already-used questions
    candidates = []
    for q in QUESTION_POOL:
        q_lang = q.get("language", "General").lower()
        lang_ok = (language.lower() == q_lang) or (q_lang == "general")
        # If current language is specific, prefer language-matching; allow general as fallback
        if not lang_ok:
            # Only include non-language questions if no language-specific matches
            continue
        if q.get("id") in used_ids:
            continue
        # Difficulty filter: match action direction
        q_diff = q.get("difficulty", "medium").lower()
        if action == "deeper":
            # Prefer same or harder; never easier
            if diff_order.get(q_diff, 2) < current_level:
                continue
        elif action == "easier":
            # Prefer same or easier; never harder
            if diff_order.get(q_diff, 2) > current_level:
                continue
        # follow_up: prefer same-level; deeper/easier acceptable but not extreme
        if action in ("follow_up", "new_topic"):
            # Allow any valid difficulty within [easy, hard]
            pass
        candidates.append(q)

    # Apply target_area preference when available (for deeper / follow_up / new_topic)
    if target_area:
        target_words = set(target_area.lower().split())
        # Try to find candidates whose topic/concept overlaps target_area
        ranked = []
        for q in candidates:
            q_text = (q.get("topic", "") + " " + q.get("concept", "") + " " + q.get("question", "")).lower()
            overlap = len([w for w in target_words if w in q_text])
            # Prefer questions in configured language when possible
            lang_bonus = 1 if (language.lower() == q.get("language", "general").lower()) else 0
            ranked.append((overlap + lang_bonus, q))
        ranked.sort(key=lambda x: x[0], reverse=True)
        if ranked:
            return ranked[0][1]

    # Fallback: choose first available matching difficulty/language
    if candidates:
        # Prefer difficulty closest to target; then language match
        best = None
        best_diff = float('inf')
        for q in candidates:
            q_diff = diff_order.get(q.get("difficulty", "medium").lower(), 2)
            dist = abs(q_diff - target_level)
            if best is None or dist < best_diff or (dist == best_diff and q.get("language", "General").lower() == language.lower()):
                best = q
                best_diff = dist
        return best

    # Ultimate safe fallback: any unused question (prevent crash)
    for q in QUESTION_POOL:
        if q.get("id") not in used_ids:
            return q
    # If all used, repeat first (should not reach here for small sessions)
    return QUESTION_POOL[0]

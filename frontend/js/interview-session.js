// Enhanced interview session — integrates adaptive backend flow.
// Uses session data (evaluations, adaptations, next_question_suggestion) from server.
// Keeps existing timer, submit/next buttons, responsive layout, dark theme.

const urlParams = new URLSearchParams(window.location.search);
const sid = urlParams.get('sid');

if (!sid) {
  document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Session not found</h2><p>No session ID was provided.</p><a href="interview.html" style="color:#22d3ee;">Return to setup</a></div>';
  throw new Error('No sid');
}

// Load session from backend with adaptive data
function loadSession() {
  return fetch('http://localhost:8007/api/interview/' + sid)
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Invalid session</h2><p>The session does not exist.</p><a href="interview.html" style="color:#22d3ee;">Start a new interview</a></div>';
        return null;
      }
      return data;
    })
    .catch(err => {
      document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Connection error</h2><p>Could not load the interview session.</p><a href="interview.html" style="color:#22d3ee;">Return to setup</a></div>';
      return null;
    });
}

function showError(msg) {
  alert(msg);
}

// Session state
let sessionData = null;
let totalQuestions = 3;
let currentQuestion = 0;
let answers = {};

const questionTitle = document.getElementById("question-title");
const questionDescription = document.getElementById("question-description");
const questionNumber = document.getElementById("question-number");
const answerBox = document.getElementById("answer");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const progressFill = document.getElementById("progress-fill");
const timer = document.getElementById("timer");

function loadQuestionWithAdaptiveData() {
  if (!sessionData) return;
  // Always use server's total_questions (respects 3/5/8 selection)
  totalQuestions = sessionData.total_questions || 3;

  // If server provides a next_question_suggestion based on adaptive logic, use it
  const suggest = sessionData.next_question_suggestion || sessionData.question_suggestion || null;
  const currentNum = sessionData.current_question_number || 1;
  let displayQuestion = sessionData.next_question_suggestion ? sessionData.next_question_suggestion.question : (sessionData.first_question || '');
  let displayNumber = currentNum;

  // If we have an adaptive suggestion with a new question, use it for next display
  // Note: the server's next_question_suggestion is stored after submit; for simplicity,
  // we read it here. If present, we show it as the next question content.
  if (suggest && suggest.question && currentNum > 1) {
    // The adaptive layer selected a new direction; display the selected question
    // We use the suggested question for the NEXT question display
    // For simplicity: if suggestion exists and we advance, we'll load from it
    displayQuestion = suggest.question;
  }

  // Use adaptive target area label with actual first question content preserved
  const adaptation = sessionData.adaptations ? sessionData.adaptations[String(currentNum)] || sessionData.adaptations["1"] : null;
  // Preserve original question title from server when available
  questionTitle.textContent = sessionData.first_question ? 'Interview' : 'Interview';

  questionDescription.textContent = displayQuestion;
  questionNumber.textContent = displayNumber;
  progressFill.style.width = (((displayNumber) / totalQuestions) * 100) + '%';
  answerBox.value = (answers && answers[String(displayNumber)]) ? answers[String(displayNumber)] : '';

  if (displayNumber === totalQuestions) nextBtn.textContent = 'Finish Interview ✅';
  else nextBtn.textContent = 'Next Question →';

  // Optional: show adaptive direction as small editorial label
  if (adaptation && adaptation.next_action && adaptation.reason) {
    // Insert a small editorial note in the hero area (not a card, just typography alignment)
    // We'll add it as a subtle text above the answer card, without redesigning
    let labelDiv = document.getElementById("adaptive-label");
    if (!labelDiv) {
      labelDiv = document.createElement('p');
      labelDiv.id = 'adaptive-label';
      labelDiv.style.cssText = 'font-size:0.75rem;color:rgba(255,255,255,0.3);letter-spacing:0.08em;margin-bottom:8px;text-transform:none;';
      // Insert before the question card
      const card = document.querySelector('.card');
      if (card && card.parentElement) {
        card.parentElement.insertBefore(labelDiv, card);
      }
    }
    labelDiv.textContent = `Adaptive direction: ${adaptation.next_action} · ${adaptation.reason}`;
  }
}

// Initialize from loaded session
loadSession().then(data => {
  if (data) {
    sessionData = data;
    totalQuestions = data.total_questions || 3;
    currentQuestion = data.current_question_number ? data.current_question_number - 1 : 0;
    answers = data.answers ? data.answers : {};
    loadQuestionWithAdaptiveData();
  }
});

submitBtn.addEventListener("click", async function () {
  const text = answerBox.value || '';
  const currentNum = (currentQuestion + 1);
  // Prevent duplicate clicks / resubmission of same question without advancing
  if (answers && answers[String(currentNum)] && answers[String(currentNum)] === text && sessionData && sessionData.current_question_number > currentNum) {
    alert('This question was already submitted and session advanced. Click Next to continue.');
    return;
  }
  try {
    const res = await fetch('http://localhost:8007/api/interview/' + sid + '/answer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question_number: currentNum, answer: text})
    });
    const data = await res.json();
    if (data.ok) {
      answers[String(currentNum)] = text;
      const refreshed = await loadSession();
      if (refreshed) {
        sessionData = refreshed;
        currentQuestion = (sessionData.current_question_number || 1) - 1;
        totalQuestions = sessionData.total_questions || 3;
      }
      loadQuestionWithAdaptiveData();
      // Confirm advancement by reading server current_question_number in alert
      alert('Answer saved for Q' + currentNum + '. Session now at Q' + (sessionData ? (sessionData.current_question_number || 1) : currentNum));
    } else {
      showError('Failed to save answer');
    }
  } catch (e) {
    showError('Server unavailable');
  }
});

nextBtn.addEventListener("click", async function () {
  const text = answerBox.value || '';
  const currentNum = (currentQuestion + 1);
  try {
    await fetch('http://localhost:8007/api/interview/' + sid + '/answer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question_number: currentNum, answer: text})
    });
    answers[String(currentNum)] = text;
  } catch (e) {}

  if (sessionData && sessionData.current_question_number >= sessionData.total_questions) {
    try {
      await fetch('http://localhost:8007/api/interview/' + sid + '/answer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({question_number: currentNum, answer: text, completed: true})
      });
    } catch (e) {}
    window.location.href = 'interview-result.html?sid=' + sid;
    return;
  }

  currentQuestion++;
  const refreshed = await loadSession();
  if (refreshed) {
    sessionData = refreshed;
    totalQuestions = sessionData.total_questions || 3;
  }
  loadQuestionWithAdaptiveData();
});

let totalSeconds = 30 * 60;
const countdown = setInterval(function () {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (timer) timer.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  totalSeconds--;
  if (totalSeconds < 0) {
    clearInterval(countdown);
    try {
      fetch('http://localhost:8007/api/interview/' + sid + '/answer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({question_number: (currentQuestion + 1), answer: answerBox.value || '', completed: true})
      });
    } catch (e) {}
    window.location.href = 'interview-result.html?sid=' + sid;
  }
}, 1000);

const urlParams = new URLSearchParams(window.location.search);
const sid = urlParams.get('sid');

if (!sid) {
  document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Session not found</h2><p>No session ID was provided.</p><a href="interview.html" style="color:#22d3ee;">Return to setup</a></div>';
  throw new Error('No sid');
}

function showError(msg) {
  alert(msg);
}

fetch('http://localhost:8000/api/interview/' + sid)
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Invalid session</h2><p>The session does not exist.</p><a href="interview.html" style="color:#22d3ee;">Start a new interview</a></div>';
      return;
    }
    sessionData = data;
    totalQuestions = data.total_questions || 3;
    currentQuestion = data.current_question_number ? data.current_question_number - 1 : 0;
    answers = data.answers ? data.answers : {};
    firstQuestionText = data.first_question || '';
    initUI();
  })
  .catch(err => {
    document.body.innerHTML = '<div style="max-width:600px;margin:100px auto;padding:24px;font-family:Inter,sans-serif;color:#fff;"><h2>Connection error</h2><p>Could not load the interview session.</p><a href="interview.html" style="color:#22d3ee;">Return to setup</a></div>';
  });

let sessionData = null;
let totalQuestions = 5;
let currentQuestion = 0;
let firstQuestionText = '';
let answers = {};

const questionTitle = document.getElementById("question-title");
const questionDescription = document.getElementById("question-description");
const questionNumber = document.getElementById("question-number");
const answerBox = document.getElementById("answer");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const progressFill = document.getElementById("progress-fill");
const timer = document.getElementById("timer");

function initUI() {
  if (sessionData && sessionData.first_question) {
    questionTitle.textContent = 'Interview';
    questionDescription.textContent = sessionData.first_question;
  }
  questionNumber.textContent = (currentQuestion + 1);
  progressFill.style.width = (((currentQuestion + 1) / totalQuestions) * 100) + '%';
  answerBox.value = (answers && answers[String(currentQuestion + 1)]) ? answers[String(currentQuestion + 1)] : '';
  if (currentQuestion === totalQuestions - 1) nextBtn.textContent = 'Finish Interview ✅';
  else nextBtn.textContent = 'Next Question →';
}

submitBtn.addEventListener("click", async function () {
  const text = answerBox.value || '';
  try {
    const res = await fetch('http://localhost:8000/api/interview/' + sid + '/answer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question_number: currentQuestion + 1, answer: text})
    });
    const data = await res.json();
    if (data.ok) {
      answers[String(currentQuestion + 1)] = text;
      alert('Answer saved');
    } else {
      showError('Failed to save answer');
    }
  } catch (e) {
    showError('Server unavailable');
  }
});

nextBtn.addEventListener("click", async function () {
  const text = answerBox.value || '';
  try {
    await fetch('http://localhost:8000/api/interview/' + sid + '/answer', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question_number: currentQuestion + 1, answer: text})
    });
    answers[String(currentQuestion + 1)] = text;
  } catch (e) { /* continue even if save fails for next */ }

  if (currentQuestion === totalQuestions - 1) {
    try {
      await fetch('http://localhost:8000/api/interview/' + sid + '/answer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({question_number: currentQuestion + 1, answer: text, completed: true})
      });
    } catch (e) {}
    window.location.href = 'interview-result.html?sid=' + sid;
    return;
  }
  currentQuestion++;
  initUI();
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
      fetch('http://localhost:8000/api/interview/' + sid + '/answer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({question_number: currentQuestion + 1, answer: answerBox.value || '', completed: true})
      });
    } catch (e) {}
    window.location.href = 'interview-result.html?sid=' + sid;
  }
}, 1000);

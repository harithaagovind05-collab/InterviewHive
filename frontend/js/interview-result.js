const urlParams = new URLSearchParams(window.location.search);
const sid = urlParams.get('sid');
const container = document.getElementById('result-container');
if (!sid) {
  container.innerHTML = '<h1>Interview Results</h1><p style="color:var(--text-secondary)">No session ID provided. <a href="interview.html" style="color:#22d3ee">Start interview</a></p>';
} else {
  fetch('http://localhost:8000/api/interview/' + sid)
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        container.innerHTML = '<h1>Interview Results</h1><p style="color:var(--text-secondary)">Session not found.</p>';
        return;
      }
      const answers = data.answers ? Object.values(data.answers).filter(Boolean).length : 0;
      const completedText = data.completed ? 'Completed' : 'In progress';
      let evalSection = '';
      if (data.evaluations) {
        const evalEntries = Object.entries(data.evaluations);
        if (evalEntries.length > 0) {
          const latestKey = evalEntries.sort((a,b) => parseInt(b[0]) - parseInt(a[0]))[0];
          const ev = data.evaluations[latestKey[0]];
          if (ev && ev.status !== 'pending') {
            evalSection = `<div class="card" style="margin-top:28px"><h3>Latest Evaluation</h3>` +
              `<p style="font-size:1.1rem;color:#fff">Score: ${ev.score !== null ? ev.score.toFixed(1) + '/100' : 'N/A'}</p>` +
              `<p style="margin-top:8px;color:var(--text-secondary);font-size:0.9rem">Status: ${ev.status || 'unknown'}</p>` +
              `<p style="margin-top:8px;color:var(--text-secondary);font-size:0.85rem">Feedback: ${ev.feedback || '-'}</p>` +
              `</div>`;
          } else {
            evalSection = `<div class="card" style="margin-top:28px"><h3>Evaluation</h3><p style="color:var(--text-secondary);font-size:0.85rem">Pending.</p></div>`;
          }
        } else {
          evalSection = `<div class="card" style="margin-top:28px"><h3>Evaluation</h3><p style="color:var(--text-secondary);font-size:0.85rem">Pending.</p></div>`;
        }
      }
      container.innerHTML = `
        <h1>Interview Results</h1>
        <p style="color:var(--text-secondary);margin-top:6px">Session ${data.session_id} · ${completedText}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-top:32px">
          <div class="card"><h2>${data.language || '-'}</h2><p style="color:var(--text-secondary);font-size:0.85rem">Language</p></div>
          <div class="card"><h2>${data.difficulty || '-'}</h2><p style="color:var(--text-secondary);font-size:0.85rem">Difficulty</p></div>
          <div class="card"><h2>${data.total_questions || '-'}</h2><p style="color:var(--text-secondary);font-size:0.85rem">Questions</p></div>
          <div class="card"><h2>${answers}</h2><p style="color:var(--text-secondary);font-size:0.85rem">Answers submitted</p></div>
        </div>
        ${evalSection}
        <div style="margin-top:28px"><a href="dashboard.html" class="btn btn-secondary">Back to Dashboard</a></div>
      `;
    })
    .catch(() => {
      container.innerHTML = '<h1>Interview Results</h1><p style="color:var(--text-secondary)">Could not load session.</p>';
    });
}

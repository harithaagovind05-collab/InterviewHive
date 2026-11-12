const urlParams = new URLSearchParams(window.location.search);
const sid = urlParams.get('sid');
const container = document.getElementById('result-container');

function renderReport(data) {
  if (data.error) {
    container.innerHTML = '<h2>Session not found.</h2><p style="color:var(--text-secondary)">Could not load session data.</p><a href="interview.html" style="color:#22d3ee">Start a new interview</a>' +
      '<div style="margin-top:40px"><a href="dashboard.html" class="btn btn-secondary">Back to Dashboard</a></div>';
    return;
  }

  const completedText = data.completed ? 'Completed' : 'In progress';
  const answersCount = data.answers ? Object.values(data.answers).filter(Boolean).length : 0;
  const totalQ = data.total_questions || 1;
  const currentQ = data.current_question_number || 1;

  // Overall performance metrics
  let scores = [];
  if (data.evaluations) {
    for (const [k, ev] of Object.entries(data.evaluations)) {
      if (ev && ev.score !== null && ev.score !== undefined) {
        scores.push({ q: parseInt(k), score: ev.score });
      }
    }
  }
  const avgScore = scores.length ? (scores.reduce((a,b) => a + b.score, 0) / scores.length).toFixed(1) : '—';

  // Skill insights: recurring strengths / common improvements across evaluations
  const allStrengths = [];
  const allImprovements = [];
  if (data.evaluations) {
    for (const ev of Object.values(data.evaluations || {})) {
      if (ev && ev.strengths) allStrengths.push(...ev.strengths);
      if (ev && ev.improvements) allImprovements.push(...ev.improvements);
    }
  }
  const recurringStrengths = [...new Set(allStrengths)].slice(0, 3);
  const recurringImprovements = [...new Set(allImprovements)].slice(0, 3);

  // Adaptive journey timeline
  const adaptations = data.adaptations ? Object.entries(data.adaptations).map(([k, v]) => ({ question: parseInt(k), ...v })) : [];
  const timelineItems = adaptations.map(a => `
    <div style="padding:20px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="font-family:var(--font-display);font-weight:600;color:#fff;font-size:0.95rem;letter-spacing:-0.02em;margin-bottom:2px;">${a.next_action || '—'} · Q${a.question}</p>
          <p style="font-size:0.8rem;color:var(--text-secondary);">${a.reason || '—'}</p>
        </div>
        <span style="font-size:0.75rem;color:rgba(255,255,255,0.3);letter-spacing:0.06em;background:rgba(255,255,255,0.04);padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.06);">${a.difficulty_adjustment >= 0 ? '+' + a.difficulty_adjustment : a.difficulty_adjustment}</span>
      </div>
      <p style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:8px;">Target: ${a.target_area || '—'}</p>
    </div>
  `).join('');

  // Question analysis table
  const analysisTable = (data.evaluations ? Object.entries(data.evaluations) : [])
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([k, ev]) => `
      <div style="padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;">
          <span style="font-family:var(--font-display);font-weight:700;font-size:1.2rem;color:#fff;letter-spacing:-0.03em;min-width:48px;">${k}</span>
          <div style="flex:1;min-width:0;">
            <h3 style="font-family:var(--font-display);font-weight:600;color:#fff;font-size:1.05rem;letter-spacing:-0.02em;margin-bottom:4px;">Interview Analysis</h3>
            <p style="font-size:0.85rem;color:rgba(255,255,255,0.4);margin-top:2px;">Score: <span style="color:#fff;font-weight:600;">${ev && ev.score !== null ? ev.score.toFixed(1) + '/100' : '—'}</span> · Status: <span style="color:${ev && ev.status === 'completed' ? '#22d3ee' : '#f59e0b'};font-weight:500;">${ev ? ev.status || '—' : '—'}</span></p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
          <div style="padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
            <h4 style="font-family:var(--font-display);font-weight:600;font-size:0.85rem;color:#fff;margin-bottom:10px;letter-spacing:0.02em;">Strengths</h4>
            <ul style="font-size:0.85rem;color:rgba(255,255,255,0.75);line-height:1.6;list-style:none;padding-left:0;display:flex;flex-direction:column;gap:6px;">
              ${(ev && ev.strengths ? ev.strengths.map(s => `<li>→ ${s}</li>`).join('') : '<li style="color:rgba(255,255,255,0.3);">No strengths recorded.</li>')}
            </ul>
          </div>
          <div style="padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;">
            <h4 style="font-family:var(--font-display);font-weight:600;font-size:0.85rem;color:#fff;margin-bottom:10px;letter-spacing:0.02em;">Improvements</h4>
            <ul style="font-size:0.85rem;color:rgba(255,255,255,0.75);line-height:1.6;list-style:none;padding-left:0;display:flex;flex-direction:column;gap:6px;">
              ${(ev && ev.improvements ? ev.improvements.map(i => `<li>→ ${i}</li>`).join('') : '<li style="color:rgba(255,255,255,0.3);">No improvements recorded.</li>')}
            </ul>
          </div>
        </div>
        <p style="font-size:0.8rem;color:rgba(255,255,255,0.35);margin-top:10px;line-height:1.55;">${ev ? ev.feedback || 'No feedback recorded for this question.' : 'No evaluation data available.'}</p>
      </div>
    `).join('');

  // Skill insights from aggregated evaluation data
  // (already computed above at lines 37-38)

  container.innerHTML = `
    <div style="position:relative;z-index:1;">
      <h1 style="font-family:var(--font-display);font-weight:700;letter-spacing:-0.06em;line-height:0.92;font-size:clamp(2.8rem,8vw,6rem);color:#fff;text-wrap:balance;margin-top:8vh;">Interview Intelligence</h1>
      <p style="margin-top:20px;font-size:1.05rem;color:rgba(255,255,255,0.55);line-height:1.6;max-width:560px;">A structured breakdown of your performance across ${totalQ} question${totalQ > 1 ? 's' : ''}. Based on real evaluation data.</p>
    </div>

    <div style="margin-top:80px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);padding:32px 0;position:relative;z-index:1;">
      <div><h3 style="font-family:var(--font-display);font-weight:600;font-size:2rem;color:#fff;letter-spacing:-0.03em;">${avgScore}/100</h3><p style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:6px;letter-spacing:0.06em;">AVERAGE SCORE</p></div>
      <div><h3 style="font-family:var(--font-display);font-weight:600;font-size:2rem;color:#fff;letter-spacing:-0.03em;">${totalQ}</h3><p style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:6px;letter-spacing:0.06em;">QUESTIONS</p></div>
      <div><h3 style="font-family:var(--font-display);font-weight:600;font-size:2rem;color:#fff;letter-spacing:-0.03em;">${answersCount}</h3><p style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:6px;letter-spacing:0.06em;">ANSWERS</p></div>
      <div><h3 style="font-family:var(--font-display);font-weight:600;font-size:2rem;color:#fff;letter-spacing:-0.03em;">${completedText}</h3><p style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:6px;letter-spacing:0.06em;">STATUS</p></div>
    </div>

    <section style="margin-top:48px;position:relative;z-index:1;">
      <p style="font-size:0.7rem;letter-spacing:0.12em;color:rgba(255,255,255,0.25);margin-bottom:20px;">SKILL INSIGHTS / AGGREGATED</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10vw;">
        <div style="padding:28px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;">
          <h3 style="font-family:var(--font-display);font-weight:600;font-size:1.05rem;color:#fff;margin-bottom:14px;letter-spacing:-0.02em;">Recurring Strengths</h3>
          <ul style="font-size:0.9rem;color:rgba(255,255,255,0.8);line-height:1.6;list-style:none;padding-left:0;display:flex;flex-direction:column;gap:8px;">
            ${recurringStrengths.length > 0 ? recurringStrengths.map(s => `<li>→ ${s}</li>`).join('') : '<li style="color:rgba(255,255,255,0.35);">No recurring strengths recorded.</li>'}
          </ul>
        </div>
        <div style="padding:28px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;">
          <h3 style="font-family:var(--font-display);font-weight:600;font-size:1.05rem;color:#fff;margin-bottom:14px;letter-spacing:-0.02em;">Areas to Improve</h3>
          <ul style="font-size:0.9rem;color:rgba(255,255,255,0.8);line-height:1.6;list-style:none;padding-left:0;display:flex;flex-direction:column;gap:8px;">
            ${recurringImprovements.length > 0 ? recurringImprovements.map(i => `<li>→ ${i}</li>`).join('') : '<li style="color:rgba(255,255,255,0.35);">No recurring improvements recorded.</li>'}
          </ul>
        </div>
      </div>
    </section>

    <section style="margin-top:48px;position:relative;z-index:1;">
      <p style="font-size:0.7rem;letter-spacing:0.12em;color:rgba(255,255,255,0.25);margin-bottom:20px;">PERFORMANCE / BY QUESTION</p>
      <h2 style="font-family:var(--font-display);font-weight:600;font-size:clamp(1.4rem,3vw,2rem);letter-spacing:-0.03em;color:#fff;margin-bottom:28px;">Detailed breakdown.</h2>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${analysisTable}
      </div>
    </section>

    <section style="margin-top:48px;position:relative;z-index:1;">
      <p style="font-size:0.7rem;letter-spacing:0.12em;color:rgba(255,255,255,0.25);margin-bottom:20px;">ADAPTIVE JOURNEY</p>
      <h2 style="font-family:var(--font-display);font-weight:600;font-size:clamp(1.4rem,3vw,2rem);letter-spacing:-0.03em;color:#fff;margin-bottom:28px;">How the interview adapted.</h2>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${timelineItems || '<p style="font-size:0.95rem;color:var(--text-secondary);">No adaptive trajectory recorded for this session.</p>'}
      </div>
    </section>

    <div style="margin-top:80px;border-top:1px solid rgba(255,255,255,0.08);padding-top:32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;position:relative;z-index:1;">
      <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;max-width:480px;">
        This report is generated from the session evaluation data stored in InterviewHive.
      </div>
      <a href="dashboard.html" class="btn btn-secondary">Back to Dashboard →</a>
    </div>
  `;
};

if (!sid) {
  container.innerHTML = '<h2>Invalid session</h2><p style="color:var(--text-secondary)">No session ID in URL.</p><a href="interview.html" style="color:#22d3ee">Start new interview</a>';
} else {
  fetch('http://localhost:8007/api/interview/' + sid)
    .then(r => r.json())
    .then(data => renderReport(data))
    .catch(() => {
      container.innerHTML = '<h2>Failed to load results</h2><p style="color:var(--text-secondary)">Could not reach the server. Make sure the backend is running on port 8007.</p><a href="interview.html" style="color:#22d3ee">Back to interview</a>';
    });
}

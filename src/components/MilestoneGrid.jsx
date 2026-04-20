import React from 'react';

export default function MilestoneGrid({ milestones = [] }) {
  if (!milestones.length) {
    return <p className="no-data">No milestone data available.</p>;
  }

  const sorted = [...milestones].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return (order[a.rag] ?? 3) - (order[b.rag] ?? 3);
  });

  return (
    <div className="milestone-grid">
      {sorted.map((m, i) => (
        <div key={i} className={`milestone-card milestone-card--${m.rag}${m.atRisk ? ' milestone-card--atrisk' : ''}`}>
          <div className="milestone-top">
            <span className={`rag-dot rag-dot--${m.rag}`} aria-label={`${m.rag} status`} />
            <span className="milestone-project mono">{m.project}</span>
            {m.atRisk && <span className="at-risk-tag">AT RISK</span>}
          </div>
          <div className="milestone-name">{m.name}</div>
          <div className="milestone-due mono">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <rect x="1" y="2" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 1v2M8 1v2M1 5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {m.dueDate}
          </div>
          <div className="progress-wrap">
            <div className="progress-track">
              <div
                className={`progress-fill progress-fill--${m.rag}`}
                style={{ width: `${Math.min(100, Math.max(0, m.progress || 0))}%` }}
                role="progressbar"
                aria-valuenow={m.progress || 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="progress-pct mono">{m.progress || 0}%</span>
          </div>
          {m.note && <div className="milestone-note">{m.note}</div>}
        </div>
      ))}
    </div>
  );
}

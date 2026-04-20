import React from 'react';

function isOverdue(due) {
  if (!due || due === 'TBD') return false;
  return new Date(due) < new Date();
}

export default function Actions({ actions = [] }) {
  if (!actions.length) return <p className="no-data">No actions recorded.</p>;

  return (
    <div className="actions-list">
      {actions.map((a, i) => {
        const overdue = isOverdue(a.due);
        return (
          <div key={i} className={`action-item${overdue ? ' action-item--overdue' : ''}`}>
            <span className="action-num mono">{String(i + 1).padStart(2, '0')}</span>
            <div className="action-body">
              <p className="action-text">{a.text}</p>
              <div className="action-meta">
                <span className="action-owner">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }}>
                    <circle cx="5.5" cy="3.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 10c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {a.owner}
                </span>
                <span className={`action-due mono${overdue ? ' action-due--overdue' : ''}`}>
                  {overdue ? '⚠ ' : ''}Due: {a.due}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

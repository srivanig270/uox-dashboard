import React from 'react';

const TYPE_MAP = {
  risk:      { label: 'risk',      bg: '#fdecea', color: '#b5261e', border: '#c0392b' },
  milestone: { label: 'milestone', bg: '#fef9ee', color: '#c97b0a', border: '#d4920a' },
  decision:  { label: 'decision',  bg: '#e3f2fd', color: '#1565c0', border: '#1976d2' },
  issue:     { label: 'issue',     bg: '#fce4ec', color: '#880e4f', border: '#ad1457' },
  resource:  { label: 'resource',  bg: '#eef7f0', color: '#2d7a3a', border: '#388e3c' },
  artifact:  { label: 'artifact',  bg: '#ede7f6', color: '#4527a0', border: '#5e35b1' },
};

export default function ChangesThisWeek({ changes = [] }) {
  if (!changes.length) {
    return <p className="no-data">No changes recorded this week.</p>;
  }

  return (
    <div className="changes-list">
      {changes.map((c, i) => {
        const style = TYPE_MAP[c.type] || TYPE_MAP.decision;
        return (
          <div key={i} className="change-card" style={{ borderLeftColor: style.border }}>
            <span className="change-type-badge mono" style={{ background: style.bg, color: style.color }}>
              {style.label}
            </span>
            <p className="change-text">{c.text}</p>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';

export default function Dependencies({ deps = [] }) {
  if (!deps.length) return <p className="no-data">No dependency data available.</p>;

  const sorted = [...deps].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return (order[a.rag] ?? 3) - (order[b.rag] ?? 3);
  });

  return (
    <div className="deps-list">
      {sorted.map((dep, i) => (
        <div key={i} className={`dep-item dep-item--${dep.rag}`}>
          <span className={`rag-dot rag-dot--${dep.rag}`} aria-label={dep.rag} />
          <div className="dep-body">
            <div className="dep-arrow-row mono">
              <span className="dep-from">{dep.from}</span>
              <span className="dep-arrow" aria-hidden="true">→</span>
              <span className="dep-to">{dep.to}</span>
            </div>
            <div className="dep-risk">{dep.risk}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

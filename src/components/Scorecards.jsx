import React from 'react';

export default function Scorecards({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="scorecards-grid">
      {items.map((card, i) => (
        <div key={i} className={`scorecard scorecard--${card.rag}`}>
          <div className="scorecard-indicator" aria-label={card.rag} />
          <div className="scorecard-label">{card.label}</div>
          <div className="scorecard-value">{card.value}</div>
          {card.subtext && <div className="scorecard-sub">{card.subtext}</div>}
        </div>
      ))}
    </div>
  );
}

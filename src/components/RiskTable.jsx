import React, { useState } from 'react';

const TREND_STYLES = {
  escalated: { bg: '#fdecea', color: '#b5261e' },
  new:       { bg: '#e3f2fd', color: '#1565c0' },
  stable:    { bg: '#f3f3f3', color: '#424242' },
  improving: { bg: '#eef7f0', color: '#2d7a3a' },
  watch:     { bg: '#fef9ee', color: '#c97b0a' },
};

const LEVEL_STYLES = {
  H: { bg: '#fdecea', color: '#b5261e' },
  M: { bg: '#fef9ee', color: '#c97b0a' },
  L: { bg: '#eef7f0', color: '#2d7a3a' },
};

export default function RiskTable({ risks = [] }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!risks.length) {
    return <p className="no-data">No risks recorded this period.</p>;
  }

  return (
    <div className="risk-table-wrap">
      <table className="risk-table" aria-label="Top risks">
        <thead>
          <tr>
            <th className="col-id">ID</th>
            <th className="col-project">Project</th>
            <th className="col-desc">Description</th>
            <th className="col-pi">P/I</th>
            <th className="col-type">Type</th>
            <th className="col-trend">Trend</th>
            <th className="col-date">Trigger</th>
            <th className="col-owner">Owner</th>
            <th className="col-mit">Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((r, i) => {
            const trend = TREND_STYLES[r.trend] || TREND_STYLES.stable;
            const level = LEVEL_STYLES[r.level] || LEVEL_STYLES.M;
            const expanded = expandedRow === i;
            return (
              <React.Fragment key={r.id || i}>
                <tr
                  className={`risk-row${expanded ? ' risk-row--expanded' : ''}`}
                  onClick={() => setExpandedRow(expanded ? null : i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="mono risk-id">{r.id}</td>
                  <td className="risk-project">{r.project}</td>
                  <td className="risk-desc">{r.description}</td>
                  <td className="center">
                    <span className="level-badge" style={{ background: level.bg, color: level.color }}>
                      {r.level}
                    </span>
                  </td>
                  <td className="mono small">{r.type}</td>
                  <td>
                    <span className="trend-badge mono" style={{ background: trend.bg, color: trend.color }}>
                      {r.trend}
                    </span>
                  </td>
                  <td className="mono small nowrap">{r.triggerDate}</td>
                  <td className="small">{r.owner}</td>
                  <td className="risk-mit small">{r.mitigation}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

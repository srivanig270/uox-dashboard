import React, { useState } from 'react';

const STATUS_MAP = {
  complete:     { bg: '#eef7f0', color: '#2d7a3a', dot: '#2d7a3a' },
  'in-progress':{ bg: '#e3f2fd', color: '#1565c0', dot: '#1565c0' },
  pending:      { bg: '#fef9ee', color: '#c97b0a', dot: '#c97b0a' },
  overdue:      { bg: '#fdecea', color: '#b5261e', dot: '#b5261e' },
  'not-started':{ bg: '#f3f3f3', color: '#616161', dot: '#9e9e9e' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP['not-started'];
  return (
    <span className="artifact-status mono" style={{ background: s.bg, color: s.color }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: s.dot, marginRight: 5, verticalAlign: 'middle' }} aria-hidden="true" />
      {status}
    </span>
  );
}

export default function ArtifactTracker({ artifacts = [] }) {
  const [collapsed, setCollapsed] = useState({});

  if (!artifacts.length) {
    return <p className="no-data">No artifact data available.</p>;
  }

  const toggle = pi => setCollapsed(prev => ({ ...prev, [pi]: !prev[pi] }));

  return (
    <div className="artifact-tracker">
      {artifacts.map((proj, pi) => {
        const isCollapsed = collapsed[pi];
        const complete = proj.items?.filter(i => i.status === 'complete').length || 0;
        const total = proj.items?.length || 0;
        const pct = total ? Math.round((complete / total) * 100) : 0;

        return (
          <div key={pi} className="artifact-project">
            <button
              className="artifact-project-header"
              onClick={() => toggle(pi)}
              aria-expanded={!isCollapsed}
            >
              <div className="artifact-project-name">{proj.project}</div>
              <div className="artifact-project-meta">
                <span className="artifact-pct mono">{pct}% complete</span>
                <span className="artifact-count mono">{complete}/{total}</span>
                <span className={`artifact-chevron${isCollapsed ? '' : ' artifact-chevron--open'}`} aria-hidden="true">›</span>
              </div>
            </button>
            {!isCollapsed && (
              <table className="artifact-table" aria-label={`${proj.project} artifacts`}>
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Artifact</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {proj.items?.map((item, ii) => (
                    <tr key={ii} className={`artifact-row artifact-row--${item.status}`}>
                      <td className="mono small artifact-gate">{item.gate}</td>
                      <td className="artifact-name">{item.artifact}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="small artifact-notes">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TREND_COLOR = { improving: '#2d7a3a', stable: '#c97b0a', deteriorating: '#b5261e' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 4, padding: '8px 12px', fontFamily: 'Courier New, monospace', fontSize: 12 }}>
      <strong>{label}</strong>: {payload[0].value}
    </div>
  );
};

export default function IssueHealth({ health }) {
  if (!health) return <p className="no-data">No issue health data available.</p>;

  const chartData = [
    { name: 'H / H', value: health.hh || 0, fill: '#c0392b' },
    { name: 'M / H', value: health.mh || 0, fill: '#c97b0a' },
    { name: 'M / M', value: health.mm || 0, fill: '#2d7a3a' },
  ];

  const stats = [
    { label: 'Total Risks',      value: health.totalRisks || 0,     muted: false },
    { label: 'Total Issues',     value: health.totalIssues || 0,    muted: false },
    { label: 'New This Week',    value: `+${health.newThisWeek || 0}`, muted: false, accent: true },
    { label: 'Closed This Week', value: health.closedThisWeek || 0, muted: true },
  ];

  const trendColor = TREND_COLOR[health.trend] || '#5c5548';

  return (
    <div className="issue-health">
      <div className="issue-health-body">
        <div className="issue-chart-wrap">
          <div className="issue-chart-label mono">Risk Severity Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dd" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontFamily: 'Courier New, monospace', fontSize: 11, fill: '#5c5548' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fontFamily: 'Courier New, monospace', fontSize: 11, fill: '#948a7c' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="issue-stats-wrap">
          <div className="issue-stats">
            {stats.map((s, i) => (
              <div key={i} className={`stat-card${s.accent ? ' stat-card--accent' : ''}${s.muted ? ' stat-card--muted' : ''}`}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label mono">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="issue-trend-wrap">
            <div className="issue-trend-badge mono" style={{ color: trendColor }}>
              <span
                style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: trendColor, marginRight: 6, verticalAlign: 'middle' }}
                aria-hidden="true"
              />
              Trend: {health.trend?.toUpperCase() || 'UNKNOWN'}
            </div>
            <p className="issue-narrative">{health.narrative}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

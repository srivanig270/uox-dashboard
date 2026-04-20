import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import UploadPanel from './components/UploadPanel';
import Scorecards from './components/Scorecards';
import RiskTable from './components/RiskTable';
import MilestoneGrid from './components/MilestoneGrid';
import ArtifactTracker from './components/ArtifactTracker';
import IssueHealth from './components/IssueHealth';
import Dependencies from './components/Dependencies';
import ChangesThisWeek from './components/ChangesThisWeek';
import Actions from './components/Actions';
import { DEMO_DATA } from './utils/demoData';
import weeklyData from './data/weeklyData.json';
import './App.css';

const STORAGE_KEY = 'uox_dashboard_v1';
const PREV_KEY    = 'uox_prev_summary_v1';
const FALLBACK_KEY = 'uox_dashboard_fallback';

function hasApiKey() {
  const k = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return k && k !== 'PASTE_KEY_HERE';
}

function RagDot({ rag }) {
  return <span className={`rag-dot rag-dot--${rag}`} aria-label={rag} />;
}

function EmptyState({ onUpload, onDemo }) {
  return (
    <div className="empty-state">
      <div className="empty-inner">
        <div className="empty-logo" aria-label="UOX Program">
          <span className="empty-logo-u">U</span>
          <span className="empty-logo-o">O</span>
          <span className="empty-logo-x">X</span>
        </div>
        <h1 className="empty-title">Executive Risk Dashboard</h1>
        <p className="empty-sub">Utilities Operations eXperience · WGL/SEMCO · Managed by PwC</p>
        <p className="empty-desc">
          No dashboard data loaded yet. Upload this week's program documents
          and Claude AI will analyze them to populate all nine sections of the executive view.
        </p>
        <div className="empty-actions">
          <button className="btn-primary btn-primary--lg" onClick={onUpload}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1v9M4 5l4-4 4 4M1 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload This Week's Documents
          </button>
          <button className="btn-demo" onClick={onDemo}>
            Load Demo Data
          </button>
        </div>
        <div className="empty-accepts">
          Accepts: Weekly Status Report (PPTX) · SteerCo Deck (PPTX) · Milestone Tracker (XLSX) · PDM Artifact Tracker (XLSX)
        </div>
      </div>
    </div>
  );
}

function FallbackBanner({ onUpload }) {
  return (
    <div className="fallback-banner" role="status">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6" stroke="#92620a" strokeWidth="1.5"/>
        <path d="M7 4v3.5M7 9.5v.5" stroke="#92620a" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className="fallback-text">Showing static data — upload files to refresh</span>
      <button className="fallback-upload-btn" onClick={onUpload}>Upload Files</button>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData(JSON.parse(saved));
        setIsFallback(!!localStorage.getItem(FALLBACK_KEY));
        return;
      }
    } catch {}

    if (!hasApiKey()) {
      setData(weeklyData);
      setIsFallback(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyData));
        localStorage.setItem(FALLBACK_KEY, '1');
      } catch {}
    }
  }, []);

  const handleNewData = newData => {
    if (data) {
      const prev = JSON.stringify({
        weekOf: data.weekOf,
        scorecards: data.scorecards,
        executiveSummary: data.executiveSummary,
        topRisks: data.topRisks?.map(r => ({ id: r.id, description: r.description, trend: r.trend, level: r.level })),
        issueHealth: data.issueHealth,
      });
      try { localStorage.setItem(PREV_KEY, prev); } catch {}
    }
    setData(newData);
    setIsFallback(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      localStorage.removeItem(FALLBACK_KEY);
    } catch {}
    setPanelOpen(false);
  };

  const getPrevSummary = () => {
    try { return localStorage.getItem(PREV_KEY); } catch { return null; }
  };

  const loadDemo = () => {
    handleNewData({ ...DEMO_DATA, generatedAt: new Date().toISOString() });
  };

  return (
    <div className="app-root">
      <Header
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen(p => !p)}
        weekOf={data?.weekOf}
        onPrint={() => window.print()}
      />

      <div className={`upload-panel-wrap${panelOpen ? ' upload-panel-wrap--open' : ''}`}>
        <UploadPanel
          onDataReady={handleNewData}
          onClose={() => setPanelOpen(false)}
          getPrevSummary={getPrevSummary}
          onDemo={loadDemo}
        />
      </div>

      {data ? (
        <>
          <NavTabs />
          {isFallback && <FallbackBanner onUpload={() => setPanelOpen(true)} />}
          <main className="dash-body" id="dashboard-content">
            <Scorecards items={data.scorecards} />

            <section id="s-summary" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">01</span>
                Executive Summary
              </h2>
              <div className="exec-bullets">
                {data.executiveSummary?.map((b, i) => (
                  <div key={i} className={`exec-bullet exec-bullet--${b.color}`}>
                    <RagDot rag={b.color} />
                    <p>{b.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="s-risks" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">02</span>
                Top Risks
              </h2>
              <RiskTable risks={data.topRisks} />
            </section>

            <section id="s-timeline" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">03</span>
                Timeline Risk
              </h2>
              <MilestoneGrid milestones={data.milestones} />
            </section>

            <section id="s-artifacts" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">04</span>
                PDM Artifact Tracker
              </h2>
              <ArtifactTracker artifacts={data.artifacts} />
            </section>

            <section id="s-issues" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">05</span>
                Issue Health
              </h2>
              <IssueHealth health={data.issueHealth} />
            </section>

            <section id="s-resources" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">06</span>
                Resource &amp; Capacity Risks
              </h2>
              <div className="prose-block">{data.resourceRisks}</div>
            </section>

            <section id="s-deps" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">07</span>
                Key Dependencies
              </h2>
              <Dependencies deps={data.dependencies} />
            </section>

            <section id="s-changes" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">08</span>
                What Changed This Week
              </h2>
              <ChangesThisWeek changes={data.changesThisWeek} />
            </section>

            <section id="s-actions" className="dash-section">
              <h2 className="section-title">
                <span className="section-num">09</span>
                Decisions &amp; Actions
              </h2>
              <Actions actions={data.actions} />
            </section>
          </main>

          <footer className="dash-footer">
            <div className="footer-inner">
              <span className="footer-meta mono">
                UOX Program · {data.programName} · Week of {data.weekOf}
                {data.generatedAt && ` · Generated ${new Date(data.generatedAt).toLocaleString()}`}
              </span>
              <button className="btn-print-footer" onClick={() => window.print()}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 5V3a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 9h6M4 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Print to PDF
              </button>
            </div>
          </footer>
        </>
      ) : (
        <EmptyState onUpload={() => setPanelOpen(true)} onDemo={loadDemo} />
      )}
    </div>
  );
}

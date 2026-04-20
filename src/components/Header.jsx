import React from 'react';

export default function Header({ panelOpen, onTogglePanel, weekOf, onPrint }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-brand">
          <span className="brand-pwc">PwC</span>
          <span className="brand-pipe" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-title">UOX Program</div>
            <div className="brand-sub">Executive Risk Dashboard · WGL/SEMCO</div>
          </div>
        </div>
        {weekOf && (
          <span className="header-week">Week of {weekOf}</span>
        )}
      </div>
      <div className="header-right">
        <button
          className={`btn-update${panelOpen ? ' btn-update--active' : ''}`}
          onClick={onTogglePanel}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Close upload panel' : 'Open upload panel'}
        >
          {panelOpen ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Close
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M3 5l4-4 4 4M1 11h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Update This Week
            </>
          )}
        </button>
        <button
          className="btn-header-print"
          onClick={onPrint}
          aria-label="Print to PDF"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 5V3a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 9h6M4 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          PDF
        </button>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 's-summary',   label: '01 Summary' },
  { id: 's-risks',     label: '02 Risks' },
  { id: 's-timeline',  label: '03 Timeline' },
  { id: 's-artifacts', label: '04 Artifacts' },
  { id: 's-issues',    label: '05 Issues' },
  { id: 's-resources', label: '06 Resources' },
  { id: 's-deps',      label: '07 Dependencies' },
  { id: 's-changes',   label: '08 Changes' },
  { id: 's-actions',   label: '09 Actions' },
];

export default function NavTabs() {
  const [active, setActive] = useState(TABS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    TABS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="nav-tabs" aria-label="Dashboard sections">
      <div className="nav-tabs-inner">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${active === tab.id ? ' nav-tab--active' : ''}`}
            onClick={() => scrollTo(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

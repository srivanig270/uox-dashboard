# UOX Program — Executive Risk Dashboard

An executive-facing risk dashboard for the **UOX Program (Utilities Operations eXperience)**, a multi-year utility transformation program at WGL/SEMCO managed by PwC.

The dashboard ingests weekly program documents (PPTX status decks, XLSX trackers), sends extracted content to the Claude AI API for analysis, and renders a fully structured risk view — persisted in the browser so it survives page refresh.

---

## Quick Start

```bash
npm install
npm start
# → http://localhost:3000
```

The dashboard opens immediately with static data from `src/data/weeklyData.json`. No API key is required to view it (yet).



## How It Works

### Fallback mode (no API key)

The app detects whether `VITE_ANTHROPIC_API_KEY` is set on load. If it is missing or still set to `PASTE_KEY_HERE`, the dashboard skips the upload screen entirely and loads directly from `src/data/weeklyData.json`. A yellow banner at the top of the dashboard indicates static data is being shown. Replacing the JSON file or adding an API key removes the banner.

### Live mode (API key present)

1. Click **Update This Week** in the header
2. Drop in one or more of the four accepted document types
3. The app extracts all text from the files client-side (no server required)
4. Extracted text is sent to `claude-opus-4-7` with a structured prompt
5. Claude returns a JSON object that maps directly to each dashboard section
6. The result is saved to `localStorage` and rendered immediately

Previous week data is also saved to `localStorage` and passed to Claude on the next upload, enabling accurate week-over-week change detection in section 08.


## Dashboard Sections

| # | Section | Source |
|---|---------|--------|
| 01 | **Executive Summary** | 5 RAG-coded bullets synthesized by Claude |
| 02 | **Top Risks** | Risk table with ID, project, P/I level, type, trend badge, trigger date, owner, and mitigation |
| 03 | **Timeline Risk** | Milestone cards with RAG status, progress bar, due date, and at-risk flag |
| 04 | **PDM Artifact Tracker** | Grouped by project — gate, artifact name, status badge, and notes |
| 05 | **Issue Health** | Bar chart by severity (H/H, M/H, M/M), stat counters, and trend narrative |
| 06 | **Resource & Capacity Risks** | Prose summary of resourcing constraints |
| 07 | **Key Dependencies** | Arrow list with RAG indicators sorted by severity |
| 08 | **What Changed This Week** | Left-border cards with type badges (risk / milestone / decision / issue / resource / artifact) |
| 09 | **Decisions & Actions** | Numbered list with owner, due date, and overdue highlighting |

A scorecard row above the sections shows six at-a-glance program health metrics.

---

## Accepted Upload Formats

| Slot | Type | Contents |
|------|------|----------|
| Weekly Status Report | `.pptx` | Weekly program status deck |
| SteerCo Deck | `.pptx` | Steering committee presentation |
| Milestone Tracker | `.xlsx` | Schedule and milestone workbook |
| PDM Artifact Tracker | `.xlsx` | Gate artifact status workbook |

At least one file is required to trigger analysis. All four can be uploaded together — Claude synthesizes them into a single coherent view.

---

## Project Structure

```
src/
├── App.jsx                   # Root — state, localStorage, layout
├── App.css                   # Full design system (tokens, typography, RAG, print)
├── index.jsx                 # React entry point
│
├── components/
│   ├── Header.jsx            # Sticky dark header with upload toggle
│   ├── NavTabs.jsx           # Sticky section nav with scroll-spy
│   ├── UploadPanel.jsx       # Drag-and-drop upload panel (animated slide-in)
│   ├── Scorecards.jsx        # 6-card RAG scorecard grid
│   ├── RiskTable.jsx         # Risk register table
│   ├── MilestoneGrid.jsx     # Milestone cards with progress bars
│   ├── ArtifactTracker.jsx   # Collapsible PDM artifact table
│   ├── IssueHealth.jsx       # Recharts bar chart + stat counters
│   ├── Dependencies.jsx      # Dependency arrow list
│   ├── ChangesThisWeek.jsx   # Left-border change cards
│   └── Actions.jsx           # Numbered action list
│
├── utils/
│   ├── fileParser.js         # PPTX + XLSX text extraction via JSZip
│   ├── claudeApi.js          # Anthropic API call (claude-opus-4-7)
│   └── demoData.js           # Sample dataset for the Load Demo Data button
│
└── data/
    └── weeklyData.json       # Static fallback data (Week of April 17, 2026)
```

---

## Design System

| Element | Treatment |
|---------|-----------|
| Background | `#f6f3ee` warm parchment |
| Header | `#111827` dark navy with `#b5261e` PwC red accent |
| Headings | Georgia serif |
| Labels, IDs, dates, badges | `Courier New` monospace |
| Body text | System sans-serif |
| RAG red | `#c0392b` |
| RAG amber | `#c97b0a` |
| RAG green | `#2d7a3a` |

The layout is mobile-responsive and includes `@media print` styles for clean PDF export via the **Print to PDF** button in the footer.

---

## Scripts

```bash
npm start       # Development server on port 3000
npm run build   # Production build → dist/
npm run preview # Preview production build locally
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `recharts` | Bar chart in Issue Health section |
| `jszip` | Client-side PPTX and XLSX parsing |
| `vite` + `@vitejs/plugin-react` | Build tooling |

"use client";

import { useState } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Scorecard {
  label: string;
  value: string;
  sub: string;
  color: "red" | "amber" | "green" | "blue";
}

interface ExecutiveSummaryItem {
  text: string;
  color: "red" | "amber" | "green" | "blue";
}

interface TopRisk {
  id: string;
  project: string;
  description: string;
  level: string;
  type: "RISK" | "ISSUE";
  trend: "new" | "escalated" | "stable" | "improving" | "watch";
  triggerDate: string;
  owner: string;
  mitigation: string;
}

interface Milestone {
  name: string;
  project: string;
  dueDate: string;
  rag: "red" | "amber" | "green";
  progress: number;
  atRisk: boolean;
  note: string;
}

interface ArtifactItem {
  gate: string;
  artifact: string;
  status: "complete" | "pending" | "na";
  notes: string;
}

interface Artifact {
  project: string;
  phase: string;
  gateTarget: string;
  rag: "red" | "amber" | "green";
  items: ArtifactItem[];
}

interface IssueHealth {
  hh: number;
  mh: number;
  mm: number;
  totalRisks: number;
  totalIssues: number;
  newThisWeek: number;
  closedThisWeek: number;
  trend: "worsening" | "stable" | "improving";
  narrative: string;
}

interface Dependency {
  from: string;
  to: string;
  risk: string;
  rag: "red" | "amber" | "green";
}

interface Change {
  type: "new" | "escalated" | "closed" | "watch" | "improving";
  text: string;
}

interface Action {
  text: string;
  owner: string;
  due: string;
}

interface DashboardData {
  programName: string;
  weekOf: string;
  scorecards: Scorecard[];
  executiveSummary: ExecutiveSummaryItem[];
  topRisks: TopRisk[];
  milestones: Milestone[];
  artifacts: Artifact[];
  issueHealth: IssueHealth;
  resourceRisks: string;
  dependencies: Dependency[];
  changesThisWeek: Change[];
  actions: Action[];
}

// ─── ANTHROPIC API ────────────────────────────────────────────────────────────
async function analyzeWithClaude(filesContent: string): Promise<DashboardData> {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are a senior PwC program management analyst. Analyze the following content extracted from UOX Program (Utilities Operations eXperience) weekly files and generate a structured executive risk dashboard.

Today's date: ${today}

FILES CONTENT:
---
${filesContent.slice(0, 45000)}
---

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:

{
  "programName": "UOX Program — Utilities Operations eXperience",
  "weekOf": "string - week date from files or today",
  "scorecards": [
    {"label": "Program Health", "value": "string", "sub": "string", "color": "red|amber|green"},
    {"label": "Next Go-Live", "value": "string", "sub": "string", "color": "red|amber|green"},
    {"label": "Open Risks/Issues", "value": "N", "sub": "string", "color": "red|amber|green"},
    {"label": "Artifacts Pending", "value": "N", "sub": "string", "color": "red|amber|green"},
    {"label": "Projects Active", "value": "N", "sub": "string", "color": "green"},
    {"label": "Program Budget", "value": "string", "sub": "string", "color": "green|amber"}
  ],
  "executiveSummary": [
    {"text": "string - concise exec-ready insight", "color": "red|amber|green|blue"}
  ],
  "topRisks": [
    {
      "id": "string",
      "project": "string",
      "description": "string",
      "level": "H/H|M/H|M/M|L/M",
      "type": "RISK|ISSUE",
      "trend": "new|escalated|stable|improving|watch",
      "triggerDate": "string",
      "owner": "string",
      "mitigation": "string"
    }
  ],
  "milestones": [
    {
      "name": "string",
      "project": "string",
      "dueDate": "string",
      "rag": "red|amber|green",
      "progress": 0,
      "atRisk": true,
      "note": "string"
    }
  ],
  "artifacts": [
    {
      "project": "string",
      "phase": "string",
      "gateTarget": "string",
      "rag": "red|amber|green",
      "items": [
        {"gate": "string", "artifact": "string", "status": "complete|pending|na", "notes": "string"}
      ]
    }
  ],
  "issueHealth": {
    "hh": 0, "mh": 0, "mm": 0,
    "totalRisks": 0, "totalIssues": 0,
    "newThisWeek": 0, "closedThisWeek": 0,
    "trend": "worsening|stable|improving",
    "narrative": "string - 2 sentences"
  },
  "resourceRisks": "string - 4-5 sentences on resource/capacity risks",
  "dependencies": [
    {"from": "string", "to": "string", "risk": "string", "rag": "red|amber|green"}
  ],
  "changesThisWeek": [
    {"type": "new|escalated|closed|watch|improving", "text": "string"}
  ],
  "actions": [
    {"text": "string", "owner": "string", "due": "string"}
  ]
}

Rules:
- Extract all real risk IDs, owners, dates, and milestone names from the files
- Milestones: show at-risk ones first, pull from Excel milestone tracker data if present
- Artifacts: group by project, pull gate status from PDM Artifact Tracker
- Actions: max 6, each specific, owned, dated
- Executive Summary: max 5 bullets, most critical first
- If a section has no data, use reasonable inferences and note as inferred`;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Analysis failed");
  }

  const data = await res.json();
  return data;
}

// ─── FILE READING ─────────────────────────────────────────────────────────────
async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".pptx") || name.endsWith(".xlsx")) {
    const bytes = new Uint8Array(buffer);
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const matches1 = [...raw.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)].map((m) => m[1]);
    const matches2 = [...raw.matchAll(/<t[^>]*>([^<]{2,})<\/t>/g)].map((m) => m[1]);
    const combined = [...matches1, ...matches2].join(" ").replace(/\s+/g, " ").trim();
    return combined.slice(0, 15000) || `[${file.name} — limited text extracted]`;
  }
  if (name.endsWith(".txt") || name.endsWith(".csv")) {
    return new TextDecoder().decode(buffer).slice(0, 15000);
  }
  return `[${file.name} uploaded — binary file]`;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  ink: "#0e1318",
  paper: "#f6f3ee",
  warm: "#ebe7df",
  rule: "#d4cfc6",
  muted: "#78726a",
  red: "#b5261e",
  redBg: "#faf0ef",
  amber: "#b86e0a",
  amberBg: "#fdf5e6",
  green: "#1a6440",
  greenBg: "#eaf3ee",
  blue: "#1b3d70",
  blueBg: "#eaeff8",
};

const RAG_COLOR: Record<string, string> = {
  red: C.red,
  amber: C.amber,
  green: C.green,
  blue: C.blue,
};

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function RagDot({ rag, label }: { rag?: string; label?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        fontWeight: 600,
        color: RAG_COLOR[rag || ""] || C.muted,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: RAG_COLOR[rag || ""] || C.rule,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {label || rag?.toUpperCase()}
    </span>
  );
}

function Badge({ type, label }: { type?: string; label?: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    new: { bg: C.blueBg, color: C.blue },
    escalated: { bg: C.redBg, color: C.red },
    stable: { bg: C.warm, color: C.muted },
    improving: { bg: C.greenBg, color: C.green },
    closed: { bg: C.greenBg, color: C.green },
    watch: { bg: C.amberBg, color: C.amber },
    pending: { bg: C.amberBg, color: C.amber },
    complete: { bg: C.greenBg, color: C.green },
    na: { bg: C.warm, color: C.muted },
    RISK: { bg: C.amberBg, color: C.amber },
    ISSUE: { bg: C.redBg, color: C.red },
  };
  const s = map[type || ""] || map.stable;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 2,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {label || type}
    </span>
  );
}

function SectionHead({ num, title, badge }: { num: string; title: string; badge?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        paddingBottom: 8,
        borderBottom: `2px solid ${C.ink}`,
        marginBottom: 20,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: C.red,
          letterSpacing: "0.1em",
        }}
      >
        {num}
      </span>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 17, flex: 1 }}>{title}</span>
      {badge && (
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            background: C.warm,
            color: C.muted,
            padding: "2px 8px",
            borderRadius: 2,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── FILE SLOTS ───────────────────────────────────────────────────────────────
interface FileSlot {
  key: "status" | "steerco" | "milestones" | "artifacts";
  label: string;
  hint: string;
  icon: string;
  accept: string;
}

const slots: FileSlot[] = [
  { key: "status", label: "Weekly Status Reports", hint: "PPTX - one or more weeks", icon: "chart", accept: ".pptx,.ppt" },
  { key: "steerco", label: "SteerCo Decks", hint: "PPTX - one or more dates", icon: "clipboard", accept: ".pptx,.ppt" },
  { key: "milestones", label: "Milestone Tracker", hint: "XLSX - all projects", icon: "calendar", accept: ".xlsx,.xls,.csv" },
  { key: "artifacts", label: "PDM Artifact Tracker", hint: "XLSX - gate status", icon: "folder", accept: ".xlsx,.xls,.csv" },
];

// ─── UPLOAD SCREEN ────────────────────────────────────────────────────────────
function UploadScreen({ onAnalyze }: { onAnalyze: (data: DashboardData) => void }) {
  const [files, setFiles] = useState<Record<"status" | "steerco" | "milestones" | "artifacts", File[]>>({
    status: [],
    steerco: [],
    milestones: [],
    artifacts: [],
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const addFiles = (key: "status" | "steerco" | "milestones" | "artifacts", incoming: FileList) => {
    setFiles((prev) => ({ ...prev, [key]: [...prev[key], ...Array.from(incoming)] }));
  };

  const removeFile = (key: "status" | "steerco" | "milestones" | "artifacts", idx: number) => {
    setFiles((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const totalFiles = Object.values(files).flat().length;

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      setStep("Reading files...");
      const all = Object.values(files).flat();
      const texts = await Promise.all(
        all.map(async (f) => {
          const t = await extractFileText(f);
          return `\n\n=== FILE: ${f.name} ===\n${t}`;
        })
      );
      setStep("Sending to Claude for analysis...");
      const data = await analyzeWithClaude(texts.join("\n"));
      setStep("Building dashboard...");
      await new Promise((r) => setTimeout(r, 500));
      onAnalyze(data);
    } catch (e) {
      setError("Analysis failed — check your API connection or try again. " + (e instanceof Error ? e.message : String(e)));
      setLoading(false);
      setStep("");
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "chart":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-4 4 4 5-6" />
          </svg>
        );
      case "clipboard":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
          </svg>
        );
      case "calendar":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        );
      case "folder":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: 860 }}>
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.red,
              marginBottom: 12,
            }}
          >
            PwC - Program Intelligence
          </div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,5vw,3.5rem)",
              color: "#f0ece4",
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            UOX Program
            <br />
            <em style={{ color: C.red }}>Executive Dashboard</em>
          </h1>
          <p
            style={{
              color: "rgba(240,236,228,0.45)",
              fontSize: 14,
              fontWeight: 300,
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Upload your weekly program files below. Claude will extract risks, milestones, artifacts, and issues — then
            generate your executive report instantly.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))",
            gap: 2,
            marginBottom: 2,
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(slot.key);
              }}
              onDragLeave={() => setDragging(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(null);
                addFiles(slot.key, e.dataTransfer.files);
              }}
              style={{
                background: dragging === slot.key ? "rgba(181,38,30,0.1)" : "rgba(240,236,228,0.04)",
                border: `1.5px dashed ${dragging === slot.key ? C.red : "rgba(240,236,228,0.15)"}`,
                padding: "1.5rem 1rem",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                position: "relative",
              }}
              onClick={() => document.getElementById(`inp-${slot.key}`)?.click()}
            >
              <input
                id={`inp-${slot.key}`}
                type="file"
                multiple
                accept={slot.accept}
                style={{ display: "none" }}
                onChange={(e) => e.target.files && addFiles(slot.key, e.target.files)}
              />
              <div style={{ color: C.red }}>{getIcon(slot.icon)}</div>
              <div style={{ color: "#f0ece4", fontSize: 13, fontWeight: 500 }}>{slot.label}</div>
              <div style={{ color: "rgba(240,236,228,0.35)", fontSize: 11, fontFamily: "var(--font-mono), monospace" }}>
                {slot.hint}
              </div>
              {files[slot.key].length > 0 && (
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                  {files[slot.key].map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(26,100,64,0.2)",
                        padding: "3px 8px",
                        borderRadius: 2,
                      }}
                    >
                      <span
                        style={{
                          color: "#4ade80",
                          fontSize: 10,
                          fontFamily: "var(--font-mono), monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 130,
                        }}
                      >
                        {f.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(slot.key, i);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(240,236,228,0.4)",
                          cursor: "pointer",
                          fontSize: 13,
                          padding: "0 2px",
                          lineHeight: 1,
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleAnalyze}
            disabled={totalFiles === 0 || loading}
            style={{
              background: totalFiles > 0 && !loading ? C.red : "rgba(240,236,228,0.1)",
              color: totalFiles > 0 && !loading ? "#fff" : "rgba(240,236,228,0.3)",
              border: "none",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "0.85rem 3rem",
              cursor: totalFiles > 0 && !loading ? "pointer" : "not-allowed",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
              minWidth: 240,
            }}
          >
            {loading ? step || "Analyzing..." : totalFiles > 0 ? `Analyze ${totalFiles} file${totalFiles > 1 ? "s" : ""}` : "Upload files to begin"}
          </button>
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: `2px solid rgba(240,236,228,0.1)`,
                  borderTopColor: C.red,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ color: "rgba(240,236,228,0.5)", fontSize: 12, fontFamily: "var(--font-mono), monospace" }}>
                {step}
              </span>
            </div>
          )}
          {error && (
            <div style={{ color: C.red, fontSize: 12, textAlign: "center", maxWidth: 400, fontFamily: "var(--font-mono), monospace" }}>
              {error}
            </div>
          )}
          <p style={{ color: "rgba(240,236,228,0.25)", fontSize: 11, fontFamily: "var(--font-mono), monospace", textAlign: "center" }}>
            Files are processed in your browser and sent to Claude API - never stored
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data, onReset }: { data: DashboardData; onReset: () => void }) {
  const [activeTab, setActiveTab] = useState("summary");

  const tabs = [
    { id: "summary", label: "01 Summary" },
    { id: "risks", label: "02 Risks" },
    { id: "timeline", label: "03 Timeline" },
    { id: "artifacts", label: "04 Artifacts" },
    { id: "issues", label: "05 Issues" },
    { id: "resources", label: "06 Resources" },
    { id: "deps", label: "07 Dependencies" },
    { id: "changes", label: "08 Changes" },
    { id: "actions", label: "09 Actions" },
  ];

  const scrollTo = (id: string) => {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sc = data.scorecards || [];

  return (
    <div style={{ background: C.paper, minHeight: "100vh" }}>
      <header style={{ background: C.ink, borderBottom: `4px solid ${C.red}` }}>
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "1.5rem 2.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.red,
                marginBottom: 4,
              }}
            >
              PwC - Program Intelligence - UOX Program
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", color: "#f0ece4", lineHeight: 1.1 }}>
              Utilities Operations <em style={{ color: C.red }}>eXperience</em>
              <br />
              <span style={{ fontSize: "1.1rem", fontStyle: "normal", fontWeight: 400 }}>Executive Risk Dashboard</span>
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: "rgba(240,236,228,0.4)",
              lineHeight: 2,
            }}
          >
            <strong style={{ color: "rgba(240,236,228,0.85)", display: "block", fontSize: 13 }}>
              Week of {data.weekOf}
            </strong>
            Source: Status Reports - SteerCo - Milestone Tracker - PDM Artifacts
            <br />
            CONFIDENTIAL — EXECUTIVE USE ONLY
            <button
              onClick={onReset}
              style={{
                marginTop: 8,
                display: "block",
                marginLeft: "auto",
                background: "none",
                border: "1px solid rgba(240,236,228,0.2)",
                color: "rgba(240,236,228,0.5)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                padding: "3px 10px",
                cursor: "pointer",
                letterSpacing: "0.08em",
              }}
            >
              NEW UPLOAD
            </button>
          </div>
        </div>
      </header>

      <nav
        style={{
          background: "#1c232e",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          overflowX: "auto",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 2.5rem", display: "flex", gap: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => scrollTo(t.id)}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: activeTab === t.id ? "#f0ece4" : "rgba(240,236,228,0.35)",
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === t.id ? C.red : "transparent"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 2.5rem 5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: 1,
            background: C.rule,
            border: `1px solid ${C.rule}`,
            marginBottom: "2.5rem",
          }}
        >
          {sc.map((s, i) => (
            <div key={i} style={{ background: C.paper, padding: "1rem 1.2rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.muted,
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.9rem",
                  lineHeight: 1,
                  color: RAG_COLOR[s.color] || C.ink,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <section id="summary" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="01" title="Executive Summary" badge={`Week of ${data.weekOf}`} />
          <div style={{ borderTop: `1px solid ${C.rule}` }}>
            {(data.executiveSummary || []).map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "0.9rem 0",
                  borderBottom: `1px solid ${C.rule}`,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: RAG_COLOR[b.color] || C.muted,
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>{b.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="risks" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="02" title="Top Program Risks & Issues" badge={`${(data.topRisks || []).length} active`} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["ID", "Project", "Description", "P/I", "Type", "Trend", "Trigger", "Owner", "Mitigation"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: C.muted,
                        padding: "6px 10px",
                        textAlign: "left",
                        borderBottom: `1.5px solid ${C.ink}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.topRisks || []).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.paper : C.warm }}>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, whiteSpace: "nowrap", borderBottom: `1px solid ${C.rule}` }}>{r.id}</td>
                    <td style={{ padding: "10px", fontSize: 11, color: C.muted, whiteSpace: "nowrap", borderBottom: `1px solid ${C.rule}` }}>{r.project}</td>
                    <td style={{ padding: "10px", lineHeight: 1.5, borderBottom: `1px solid ${C.rule}`, maxWidth: 280 }}>{r.description}</td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${C.rule}`, whiteSpace: "nowrap" }}>
                      <RagDot rag={r.level?.startsWith("H") ? "red" : r.level?.startsWith("M/H") ? "amber" : "amber"} label={r.level} />
                    </td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${C.rule}` }}><Badge type={r.type} /></td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${C.rule}` }}><Badge type={r.trend} /></td>
                    <td style={{ padding: "10px", fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, whiteSpace: "nowrap", borderBottom: `1px solid ${C.rule}` }}>{r.triggerDate}</td>
                    <td style={{ padding: "10px", fontSize: 11, whiteSpace: "nowrap", borderBottom: `1px solid ${C.rule}` }}>{r.owner}</td>
                    <td style={{ padding: "10px", fontSize: 11, color: C.muted, lineHeight: 1.5, borderBottom: `1px solid ${C.rule}`, maxWidth: 240 }}>{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="timeline" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="03" title="Timeline Risk — Milestones At Risk or Upcoming" badge="sourced from Milestone Tracker" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
            {(data.milestones || []).map((m, i) => {
              const fill: Record<string, string> = { red: C.red, amber: C.amber, green: C.green };
              return (
                <div key={i} style={{ background: C.paper, padding: "1.1rem 1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{m.name}</div>
                    <RagDot rag={m.rag} label="" />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.project}</div>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: m.atRisk ? C.red : C.muted, marginBottom: 4 }}>Due: {m.dueDate}{m.atRisk ? " !" : ""}</div>
                  {m.note && <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginBottom: 6 }}>{m.note}</div>}
                  <div style={{ height: 3, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${m.progress}%`, background: fill[m.rag] || C.muted, borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="artifacts" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="04" title="PDM Artifact Tracker — Gate Status by Project" badge="sourced from PDM Artifact Tracker" />
          {(data.artifacts || []).map((proj, pi) => (
            <div key={pi} style={{ marginBottom: 2 }}>
              <div
                style={{
                  background: C.ink,
                  color: "#f0ece4",
                  padding: "8px 12px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 1,
                }}
              >
                <RagDot rag={proj.rag} label="" />
                {proj.project} - {proj.phase} - Gate Target: {proj.gateTarget}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Gate", "Artifact", "Status", "Notes"].map((h) => (
                      <th key={h} style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, padding: "5px 10px", textAlign: "left", borderBottom: `1px solid ${C.rule}`, background: C.warm }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(proj.items || []).map((item, ii) => (
                    <tr key={ii}>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.rule}`, whiteSpace: "nowrap" }}>{item.gate}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.rule}` }}>{item.artifact}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.rule}` }}><Badge type={item.status} /></td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.rule}` }}>{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <section id="issues" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="05" title="Issue Health & Trends" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            <div>
              {[
                { label: "H/H Critical", val: data.issueHealth?.hh || 0, color: C.red },
                { label: "M/H High", val: data.issueHealth?.mh || 0, color: C.amber },
                { label: "M/M Medium", val: data.issueHealth?.mm || 0, color: C.blue },
                { label: "Total Risks", val: data.issueHealth?.totalRisks || 0, color: C.amber },
                { label: "Total Issues", val: data.issueHealth?.totalIssues || 0, color: C.red },
              ].map((row, i) => {
                const max = Math.max(data.issueHealth?.hh || 0, data.issueHealth?.mh || 0, data.issueHealth?.mm || 0, data.issueHealth?.totalRisks || 0, data.issueHealth?.totalIssues || 0, 1);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 100, fontSize: 12, flexShrink: 0 }}>{row.label}</span>
                    <div style={{ flex: 1, height: 5, background: C.rule, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(row.val / max) * 100}%`, background: row.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: C.muted, width: 20, textAlign: "right" }}>{row.val}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: "2rem", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.rule}`, flexWrap: "wrap" }}>
                {[
                  { label: "New", val: data.issueHealth?.newThisWeek || 0, color: C.blue },
                  { label: "Closed", val: data.issueHealth?.closedThisWeek || 0, color: C.green },
                  { label: "Trend", val: (data.issueHealth?.trend || "—").toUpperCase(), color: data.issueHealth?.trend === "worsening" ? C.red : data.issueHealth?.trend === "improving" ? C.green : C.amber },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: s.color }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: C.ink }}>{data.issueHealth?.narrative}</div>
          </div>
        </section>

        <section id="resources" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="06" title="Resource & Capacity Risks" />
          <div style={{ fontSize: 13, lineHeight: 1.85, color: C.ink, maxWidth: 900 }}>{data.resourceRisks}</div>
        </section>

        <section id="deps" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="07" title="Key Cross-Project Dependencies" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(data.dependencies || []).map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: C.warm }}>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: C.muted, flexShrink: 0, paddingTop: 1 }}>{">"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{d.from} <span style={{ fontWeight: 300, color: C.muted }}>depends on</span> {d.to}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{d.risk}</div>
                </div>
                <RagDot rag={d.rag} label="" />
              </div>
            ))}
          </div>
        </section>

        <section id="changes" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="08" title="What Changed This Week" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(data.changesThisWeek || []).map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  background: C.warm,
                  borderLeft: `3px solid ${RAG_COLOR[c.type === "escalated" ? "red" : c.type === "new" ? "blue" : c.type === "closed" || c.type === "improving" ? "green" : "amber"] || C.amber}`,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <Badge type={c.type} />
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="actions" style={{ marginBottom: "2.5rem", scrollMarginTop: 60 }}>
          <SectionHead num="09" title="Decisions & Actions Required" badge={`${(data.actions || []).length} items`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(data.actions || []).map((a, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10, alignItems: "start", padding: "12px 14px", border: `1px solid ${C.rule}`, background: C.paper }}>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: C.red, fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 13, lineHeight: 1.6 }}>{a.text}</span>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, lineHeight: 1.8, whiteSpace: "nowrap" }}>
                  {a.owner}<br />{a.due}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: "3rem",
            paddingTop: "1.25rem",
            borderTop: `1px solid ${C.rule}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span>Generated {new Date().toLocaleString()} - UOX Program Executive Dashboard - PwC Program Intelligence - CONFIDENTIAL</span>
          <button onClick={() => window.print()} style={{ background: C.ink, color: "#f0ece4", border: "none", fontFamily: "sans-serif", fontSize: 12, padding: "6px 16px", cursor: "pointer" }}>
            Print / Save as PDF
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  return dashData ? <Dashboard data={dashData} onReset={() => setDashData(null)} /> : <UploadScreen onAnalyze={setDashData} />;
}

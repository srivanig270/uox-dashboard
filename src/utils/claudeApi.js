const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a senior program management analyst at PwC reviewing documents for the UOX Program (Utilities Operations eXperience) — a multi-year utility transformation program at WGL/SEMCO. Produce structured JSON dashboards from program documents. Be precise, analytical, and surface real risks and issues.`;

const RESPONSE_SCHEMA = `{
  "programName": "UOX Program",
  "weekOf": "YYYY-MM-DD",
  "generatedAt": "ISO 8601 timestamp",
  "scorecards": [
    { "label": "Overall RAG", "value": "RED|AMBER|GREEN", "rag": "red|amber|green", "subtext": "brief qualifier" },
    { "label": "Open Risks", "value": "number as string", "rag": "red|amber|green", "subtext": "+/- vs last week" },
    { "label": "Milestones At Risk", "value": "number as string", "rag": "red|amber|green", "subtext": "of N total" },
    { "label": "Open Issues", "value": "number as string", "rag": "red|amber|green", "subtext": "trend note" },
    { "label": "Artifacts Complete", "value": "NN%", "rag": "red|amber|green", "subtext": "of gate artifacts" },
    { "label": "Actions Overdue", "value": "number as string", "rag": "red|amber|green", "subtext": "require attention" }
  ],
  "executiveSummary": [
    { "color": "red|amber|green", "text": "Executive bullet point — concise and specific" }
  ],
  "topRisks": [
    {
      "id": "R-001",
      "project": "Project/workstream name",
      "description": "Specific risk description",
      "level": "H|M|L",
      "type": "Schedule|Resource|Technical|Operational|Financial|Dependency",
      "trend": "new|escalated|stable|improving|watch",
      "triggerDate": "YYYY-MM-DD or TBD",
      "owner": "First Last",
      "mitigation": "Active mitigation steps"
    }
  ],
  "milestones": [
    {
      "name": "Milestone name",
      "project": "Project name",
      "dueDate": "YYYY-MM-DD",
      "rag": "red|amber|green",
      "progress": 0,
      "atRisk": false,
      "note": "Brief status note"
    }
  ],
  "artifacts": [
    {
      "project": "Project Name",
      "items": [
        {
          "gate": "Gate label",
          "artifact": "Artifact name",
          "status": "complete|in-progress|pending|overdue|not-started",
          "notes": "Notes if any"
        }
      ]
    }
  ],
  "issueHealth": {
    "hh": 0,
    "mh": 0,
    "mm": 0,
    "totalRisks": 0,
    "totalIssues": 0,
    "newThisWeek": 0,
    "closedThisWeek": 0,
    "trend": "improving|stable|deteriorating",
    "narrative": "2-3 sentence narrative on issue and risk health trends."
  },
  "resourceRisks": "Prose paragraph on resource and capacity risks across the program.",
  "dependencies": [
    {
      "from": "Source system or team",
      "to": "Dependent system or team",
      "risk": "Description of the dependency risk",
      "rag": "red|amber|green"
    }
  ],
  "changesThisWeek": [
    {
      "type": "risk|milestone|decision|issue|resource|artifact",
      "text": "What specifically changed this week"
    }
  ],
  "actions": [
    {
      "text": "Specific action description",
      "owner": "Owner Name",
      "due": "YYYY-MM-DD"
    }
  ]
}`;

export async function analyzeWithClaude(extractedTexts, prevSummary) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
    throw new Error(
      'Claude API key not configured. Add your Anthropic API key to the .env file as VITE_ANTHROPIC_API_KEY.'
    );
  }

  const docSections = Object.entries(extractedTexts)
    .map(([label, text]) => `=== ${label.toUpperCase()} ===\n${text}`)
    .join('\n\n');

  const prevSection = prevSummary
    ? `\n\n=== PREVIOUS WEEK SUMMARY (use for week-over-week Changes This Week section) ===\n${prevSummary}`
    : '';

  const userPrompt = `Analyze these UOX Program documents and return a complete executive risk dashboard as JSON.

${docSections}${prevSection}

Return ONLY a single JSON object matching this schema exactly. Populate every field from the documents; infer reasonable values for utility transformation programs where data is absent. Include all risks, milestones, and artifacts found. Executive summary must have exactly 5 bullets.

Schema:
${RESPONSE_SCHEMA}

Return ONLY the JSON object. No markdown fences, no explanation, no preamble.`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData?.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await res.json();
  const rawText = data?.content?.[0]?.text;

  if (!rawText) throw new Error('Empty response from Claude API.');

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${e.message}\n\nRaw: ${cleaned.slice(0, 300)}`);
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to analyze with Claude" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const raw = data.content?.map((i: { text?: string }) => i.text || "").join("") || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    
    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      console.error("Failed to parse Claude response:", clean);
      return NextResponse.json(
        { error: "Failed to parse analysis response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

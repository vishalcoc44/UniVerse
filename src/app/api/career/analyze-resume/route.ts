import { NextResponse } from "next/server";
import { createClient } from "@/lib/server-supabase";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface ResumeFeedback {
  quickFixes: Array<{
    type: "critical" | "warning";
    title: string;
    description: string;
  }>;
  keywords: {
    found: string[];
    missing: string[];
  };
  impactScore: number;
  summary: string;
}

function normalizeFeedback(value: unknown): ResumeFeedback {
  if (!value || typeof value !== "object") {
    throw new Error("AI returned invalid response shape.");
  }

  const candidate = value as Partial<ResumeFeedback>;
  const rawQuickFixes: unknown[] = Array.isArray((candidate as { quickFixes?: unknown[] }).quickFixes)
    ? (candidate as { quickFixes: unknown[] }).quickFixes
    : [];
  const keywords = candidate.keywords && typeof candidate.keywords === "object"
    ? candidate.keywords
    : { found: [], missing: [] };

  const found = Array.isArray((keywords as { found?: unknown[] }).found)
    ? (keywords as { found: string[] }).found.map(String)
    : [];
  const missing = Array.isArray((keywords as { missing?: unknown[] }).missing)
    ? (keywords as { missing: string[] }).missing.map(String)
    : [];

  const cleanedQuickFixes = rawQuickFixes
    .map((fix) => {
      if (!fix || typeof fix !== "object") return null;
      const current = fix as { type?: unknown; title?: unknown; description?: unknown };
      return {
        type: current.type === "critical" ? "critical" as const : "warning" as const,
        title: String(current.title ?? "Improvement Opportunity"),
        description: String(current.description ?? "Consider refining this section.")
      };
    })
    .filter((fix): fix is { type: "critical" | "warning"; title: string; description: string } => !!fix)
    .slice(0, 6);

  const numericScore = Number(candidate.impactScore ?? 0);
  const impactScore = Number.isFinite(numericScore)
    ? Math.max(0, Math.min(100, Math.round(numericScore)))
    : 0;

  // FC-17: clamp summary to 1000 chars. Bounds prompt-injection-controlled output
  // before it reaches the client. Other AI fields (impactScore, arrays) are
  // already bounded above; summary was unbounded.
  const summary = String(candidate.summary ?? "No summary returned by model.").slice(0, 1000);

  return {
    quickFixes: cleanedQuickFixes,
    keywords: {
      found: found.slice(0, 20),
      missing: missing.slice(0, 20)
    },
    impactScore,
    summary
  };
}

function parseAiJson(raw: string): ResumeFeedback {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return normalizeFeedback(parsed);
}

function getAnalysisPrompt(source: "pdf" | "text", textSample?: string): string {
  const basePrompt = `Analyze this resume and return ONLY valid JSON.

Required JSON shape:
{
  "quickFixes": [{ "type": "critical" | "warning", "title": "...", "description": "..." }],
  "keywords": { "found": ["..."], "missing": ["..."] },
  "impactScore": number,
  "summary": "..."
}

Constraints:
- quickFixes max 6 items
- impactScore must be an integer from 0 to 100
- keywords should be role-relevant technical/professional terms
- summary max 120 words
- return JSON only (no markdown)`;

  if (source === "pdf") {
    return `${basePrompt}\n\nThe resume is attached as a PDF file.`;
  }

  return `${basePrompt}\n\nResume text:\n${(textSample ?? "").slice(0, 15000)}`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // FC-16: rate-limit AI calls. Gemini quota is shared across the app; an
    // authenticated attacker can otherwise spam this endpoint to drain the
    // budget. 5 requests / 10 min is enough for legitimate review iteration.
    const { allowed, resetInSeconds } = rateLimit(`analyze-resume:${user.id}`, {
      maxRequests: 5,
      windowMs: 10 * 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many resume analyses. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(resetInSeconds) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isPdf = file.type.includes("pdf") || fileName.endsWith(".pdf");
    const isPlainText = file.type === "text/plain" || fileName.endsWith(".txt");

    if (!isPdf && !isPlainText) {
      return NextResponse.json(
        { error: "Only PDF or plain text resumes are supported." },
        { status: 415 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Server AI key is not configured." }, { status: 500 });
    }

    let parts: Array<Record<string, unknown>>;

    if (isPdf) {
      const bytes = Buffer.from(await file.arrayBuffer());
      parts = [
        { text: getAnalysisPrompt("pdf") },
        {
          inline_data: {
            mime_type: "application/pdf",
            data: bytes.toString("base64")
          }
        }
      ];
    } else {
      const extractedText = (await file.text()).trim();
      if (!extractedText) {
        return NextResponse.json({ error: "Could not extract readable text from resume." }, { status: 422 });
      }

      parts = [{ text: getAnalysisPrompt("text", extractedText) }];
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ]
      })
    });

    if (!response.ok) {
      // FC-18: don't pass Gemini's error message through to the client. Log
      // server-side; return a generic message that doesn't leak provider state.
      try {
        const errorData = await response.json();
        console.error("Gemini API error:", JSON.stringify(errorData));
      } catch {
        console.error("Gemini API non-JSON error, status:", response.status);
      }
      return NextResponse.json(
        { error: "AI provider request failed. Please try again later." },
        { status: 502 }
      );
    }

    const aiResult = await response.json();
    const rawText = aiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json({ error: "AI returned empty content." }, { status: 502 });
    }

    const feedback = parseAiJson(rawText);
    return NextResponse.json({ feedback, score: feedback.impactScore });
  } catch (error) {
    console.error("Resume analysis error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "An unexpected error occurred during analysis." }, { status: 500 });
  }
}

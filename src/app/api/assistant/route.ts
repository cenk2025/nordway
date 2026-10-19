import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, AI_FAST_MODEL } from "@/lib/ai/client";
import { isNvidiaConfigured, nvidiaStream } from "@/lib/ai/nvidia";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
// NVIDIA's free tier can take ~30 s before the first token and may try several models.
export const maxDuration = 120;

const BodySchema = z.object({
  locale: z.enum(["tr", "fi", "en", "sv", "no"]).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

// 15 requests / 5 min / IP — shared across all Vercel instances via Upstash
// Redis when configured (see src/lib/rate-limit.ts), which is what makes this
// a real cap rather than a per-instance one on serverless hosting.
const RATE_LIMIT = 15;
const RATE_WINDOW_SECONDS = 5 * 60;

const LANG = { tr: "Turkish", fi: "Finnish", en: "English", sv: "Swedish", no: "Norwegian" };

function systemPrompt(locale: keyof typeof LANG): string {
  return `You are Nordway's eligibility assistant. Nordway is a private advisory service that helps people relocate from Türkiye to Finland (and later Sweden and Norway) — to work, start a business, study, or reunite with family.

Scope and rules:
- Answer ONLY questions about relocating to / immigrating to Finland (permits, eligibility, documents, the process, settling in) and about Nordway's services. If asked anything off-topic, briefly decline and steer back.
- Reply in ${LANG[locale]}.
- Be concise, warm, and practical. Respond directly with your final answer; do not include exploratory reasoning or meta-commentary.
- NEVER guarantee a residence-permit outcome. Decisions are made solely by Migri, Elinvoimakeskus, or Business Finland.
- Make clear Nordway is NOT a government authority and does not replace Migri; official applications are submitted by the user via Enter Finland.
- Income thresholds and fees change; give them as approximate 2026 references and tell the user to verify current values at migri.fi.
- End every answer with a short disclaimer on its own line: "ℹ️ General information only — the official source is Migri (migri.fi)." (translate this line into ${LANG[locale]}).
- Do not invent specific legal advice; for binding legal questions, suggest a licensed immigration lawyer.`;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (await isRateLimited(ip, RATE_LIMIT, RATE_WINDOW_SECONDS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const system = systemPrompt(body.locale);
  const encoder = new TextEncoder();

  // Preferred: NVIDIA NIM. Model fallback happens before any byte is sent, so
  // if every NVIDIA model fails we can still switch to Anthropic below.
  if (isNvidiaConfigured()) {
    try {
      const deltas = await nvidiaStream([{ role: "system", content: system }, ...body.messages]);
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const text of deltas) controller.enqueue(encoder.encode(text));
          } catch {
            // Keep any partial text already sent; the client handles an empty reply.
          } finally {
            controller.close();
          }
        },
      });
      return textStream(stream);
    } catch (err) {
      console.error("Assistant: NVIDIA unavailable, trying Anthropic:", (err as Error).message);
    }
  }

  const client = getAnthropic();
  if (!client) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Stream the reply as plain-text chunks so the widget renders tokens live.
  // Chatbot uses the fast model (low effort) for snappy responses.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const ms = client.messages.stream({
          model: AI_FAST_MODEL,
          max_tokens: 1024,
          output_config: { effort: "low" },
          system,
          messages: body.messages,
        });
        for await (const event of ms) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        await ms.finalMessage();
      } catch {
        // On failure just end the stream. If nothing was emitted the client
        // shows a friendly error; any partial text already sent is kept.
      } finally {
        controller.close();
      }
    },
  });

  return textStream(stream);
}

function textStream(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

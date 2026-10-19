import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Premium model — used for deep reasoning (admin case assessment). Override with
 * ANTHROPIC_MODEL. Fable 5 is Anthropic's most capable model; it requires 30-day
 * data retention (not available under ZDR) and costs more than Opus-tier.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-fable-5";

/**
 * Fast model — used for latency-sensitive, high-volume calls (the chatbot).
 * Override with ANTHROPIC_FAST_MODEL.
 */
export const AI_FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL || "claude-opus-4-8";

/** Model to fall back to if the primary declines a request (safety refusal). */
export const AI_FALLBACK_MODEL = "claude-opus-4-8";

/**
 * Returns an Anthropic client, or null when no real key is configured (so AI
 * features degrade gracefully instead of throwing). Server-only — the key is
 * never sent to the browser.
 */
export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !key.trim() || key.includes("your-anthropic")) return null;
  return new Anthropic({ apiKey: key });
}

/** Join the text blocks of a message response into a single string. */
export function textFromMessage(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * Run a non-streaming completion on AI_MODEL and return its text. Fable 5 can
 * decline a request via a safety classifier (`stop_reason: "refusal"`); if that
 * happens we transparently retry the same prompt on the Opus fallback model
 * (replaying the history as-is — other models simply ignore Fable's thinking
 * blocks). Returns `refused: true` only if the fallback also declines.
 */
export async function completeText(
  client: Anthropic,
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">,
  model: string = AI_MODEL
): Promise<{ text: string; refused: boolean }> {
  const primary = await client.messages.create({ ...params, model });
  if (String(primary.stop_reason) !== "refusal") {
    return { text: textFromMessage(primary.content), refused: false };
  }
  if (model === AI_FALLBACK_MODEL) return { text: "", refused: true };

  const fallback = await client.messages.create({ ...params, model: AI_FALLBACK_MODEL });
  return String(fallback.stop_reason) === "refusal"
    ? { text: "", refused: true }
    : { text: textFromMessage(fallback.content), refused: false };
}

import "server-only";

/**
 * NVIDIA NIM chat client (OpenAI-compatible endpoint, free tier at
 * build.nvidia.com) — same setup as the sibling VOON apps (`saas`, `tyo`).
 * Used for both AI features when NVIDIA_API_KEY is set; src/lib/ai/client.ts
 * falls back to Anthropic when NVIDIA is unconfigured or every model fails.
 *
 * Models on the free tier come and go and some are gated per account, so we
 * try several in turn instead of depending on one, remembering the last model
 * that answered. The free tier is slow (first token can take ~20-30 s) and
 * rate-limited; NVIDIA's trial terms are for evaluation, not production.
 */

const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";

const FALLBACK_MODELS = [
  "deepseek-ai/deepseek-v4.1-flash",
  "google/gemma-4-31b-it",
  "mistralai/mistral-large-2-instruct",
  "z-ai/glm-5.3-flash",
  "moonshotai/kimi-k2.6",
];

/** Per-model wait for response headers (the stream itself may run longer). */
const MODEL_TIMEOUT_MS = 40_000;
/** Stop trying further models after this long so routes stay within maxDuration. */
const FALLBACK_BUDGET_MS = 85_000;

let workingModel: string | null = null;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function isNvidiaConfigured(): boolean {
  const key = process.env.NVIDIA_API_KEY;
  return Boolean(key && key.trim() && !key.includes("your-key"));
}

function models(): string[] {
  return [
    ...new Set(
      [workingModel, process.env.NVIDIA_CHAT_MODEL, ...FALLBACK_MODELS].filter(
        (m): m is string => Boolean(m)
      )
    ),
  ];
}

/**
 * POST a chat completion to each model in turn until one returns 2xx. A bad
 * key (401/403) fails at once; anything else (model gated/removed, 429, 5xx,
 * timeout) moves on to the next model.
 */
async function requestWithFallback(body: Record<string, unknown>): Promise<Response> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY is not set");
  const started = Date.now();
  let lastError: unknown = new Error("No NVIDIA model available");

  for (const model of models()) {
    if (Date.now() - started > FALLBACK_BUDGET_MS) break;
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model }),
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      });
      if (res.ok) {
        workingModel = model;
        return res;
      }
      const detail = await res.text().catch(() => "");
      lastError = new Error(`NVIDIA ${model} ${res.status}: ${detail.slice(0, 200)}`);
      console.error(String(lastError));
      if (res.status === 401 || res.status === 403) break;
    } catch (err) {
      lastError = err;
      console.error(`NVIDIA ${model} failed:`, (err as Error).message);
    }
    if (model === workingModel) workingModel = null;
  }
  throw lastError;
}

/** Drop `<think>…</think>` reasoning some open models emit inline. */
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/** Non-streaming completion; returns the answer text. */
export async function nvidiaComplete(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await requestWithFallback({
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1500,
  });
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return stripThinking(json.choices?.[0]?.message?.content ?? "");
}

/**
 * Streaming completion. Resolves once a model has accepted the request (so a
 * failing model is detected — and the next tried — before anything is sent to
 * the browser), then yields text deltas with inline reasoning filtered out.
 */
export async function nvidiaStream(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<AsyncGenerator<string>> {
  const res = await requestWithFallback({
    messages,
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 1024,
    stream: true,
  });
  if (!res.body) throw new Error("NVIDIA returned no stream");
  return deltas(res.body);
}

async function* deltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let inThink = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.trim();
      if (!data.startsWith("data:")) continue;
      const payload = data.slice(5).trim();
      if (payload === "[DONE]") return;
      let text: string | undefined;
      try {
        text = (JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
          ?.delta?.content;
      } catch {
        continue;
      }
      if (!text) continue;
      // Filter inline <think> blocks; tags arrive as their own tokens in practice.
      let out = "";
      let rest = text;
      while (rest) {
        if (inThink) {
          const end = rest.indexOf("</think>");
          if (end === -1) break;
          inThink = false;
          rest = rest.slice(end + "</think>".length);
        } else {
          const start = rest.indexOf("<think>");
          if (start === -1) {
            out += rest;
            break;
          }
          out += rest.slice(0, start);
          inThink = true;
          rest = rest.slice(start + "<think>".length);
        }
      }
      if (out) yield out;
    }
  }
}

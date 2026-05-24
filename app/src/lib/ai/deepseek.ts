/**
 * DeepSeek API client — Edge runtime safe.
 *
 * Carries forward bazi-studio lessons:
 *  - key is ONLY read here from process.env (never bundled to client)
 *  - model fallback: deepseek-v4-pro → deepseek-chat (on 4xx/region errors)
 *  - JSON-mode helper for structured outputs (S1..S5)
 *  - streaming for /api/ai/chat
 *
 * Do not import this module from any client component or src/app/[locale]/**.
 */
import "server-only";

const BASE = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const PRIMARY = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";
const FALLBACK = process.env.DEEPSEEK_FALLBACK_MODEL ?? "deepseek-chat";

function key(): string {
  const k = process.env.DEEPSEEK_API_KEY;
  if (!k) throw new Error("DEEPSEEK_API_KEY missing");
  return k;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
  signal?: AbortSignal;
};

async function callOnce(model: string, opts: ChatOptions): Promise<Response> {
  return fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.max_tokens ?? 2048,
      stream: false,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: opts.signal,
  });
}

/** JSON-mode (non-streaming) call with model fallback. */
export async function chatJSON<T = unknown>(opts: ChatOptions): Promise<T> {
  const models = [opts.model ?? PRIMARY, FALLBACK];
  let lastErr: Error | null = null;
  for (const m of models) {
    try {
      const r = await callOnce(m, { ...opts, json: true });
      if (!r.ok) {
        const txt = await r.text();
        if (r.status === 400 || r.status === 404) {
          // model not supported / region — try next
          lastErr = new Error(`deepseek ${m} ${r.status}: ${txt.slice(0, 200)}`);
          continue;
        }
        throw new Error(`deepseek ${m} ${r.status}: ${txt.slice(0, 200)}`);
      }
      const data = await r.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content) as T;
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw lastErr ?? new Error("deepseek failed");
}

/** Streaming call returning Response with SSE chunks (for /api/ai/chat). */
export async function chatStream(opts: ChatOptions): Promise<Response> {
  const model = opts.model ?? PRIMARY;
  const r = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!r.ok && (r.status === 400 || r.status === 404)) {
    // try fallback once
    return fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key()}`,
      },
      body: JSON.stringify({
        model: FALLBACK,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 2048,
        stream: true,
      }),
      signal: opts.signal,
    });
  }
  return r;
}

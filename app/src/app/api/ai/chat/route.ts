/**
 * POST /api/ai/chat — DeepSeek SSE proxy.
 * Edge runtime. Key never leaves this file.
 * GET returns 405 (per bazi-studio convention).
 */
import { chatStream, type ChatMessage } from "@/lib/ai/deepseek";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export const runtime = "edge";

export async function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
}

export async function POST(req: Request) {
  // 1. rate limit
  const rl = rateLimit(ipKey(req), { windowMs: 60_000, max: 30 });
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
      },
    });
  }

  // 2. parse body
  let body: { messages: ChatMessage[]; locale?: "zh" | "en" };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages_required" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  // 3. call DeepSeek (stream)
  try {
    const upstream = await chatStream({
      messages: body.messages,
      temperature: 0.7,
    });
    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: "upstream", detail: txt.slice(0, 200) }), {
        status: 502, headers: { "content-type": "application/json" },
      });
    }
    // pipe upstream SSE to client
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-ratelimit-remaining": String(rl.remaining),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", detail: (e as Error).message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
}

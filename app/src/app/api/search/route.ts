/**
 * GET /api/search?q=...&mode=keyword|semantic
 */
import { NextResponse } from "next/server";
import { keywordSearch } from "@/lib/search/keyword";
import { semanticSearch } from "@/lib/search/semantic";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// W6 (Phase D round-001): rate-limit /api/search to protect OpenAI embedding
// bill on `mode=semantic`. 30 req / 60s / IP — same envelope as ai/chat.
const SEARCH_RATE = { windowMs: 60_000, max: 30 };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const mode = (url.searchParams.get("mode") ?? "keyword") as "keyword" | "semantic";
  if (!q) {
    return NextResponse.json({ error: "q_required" }, { status: 400 });
  }
  const rl = rateLimit(ipKey(req), SEARCH_RATE);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: rl.resetAt },
      {
        status: 429,
        headers: {
          "x-ratelimit-remaining": String(rl.remaining),
          "x-ratelimit-reset": String(rl.resetAt),
          "retry-after": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }
  try {
    const res = mode === "semantic" ? await semanticSearch(q) : await keywordSearch(q);
    return NextResponse.json(res);
  } catch (e) {
    // fallback: semantic failure → keyword
    if (mode === "semantic") {
      try {
        const res = await keywordSearch(q);
        return NextResponse.json(res, { headers: { "x-fallback": "semantic-to-keyword" } });
      } catch (e2) {
        return NextResponse.json({ error: "internal", detail: (e2 as Error).message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "internal", detail: (e as Error).message }, { status: 500 });
  }
}

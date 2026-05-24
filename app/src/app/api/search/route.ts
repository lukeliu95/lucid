/**
 * GET /api/search?q=...&mode=keyword|semantic
 */
import { NextResponse } from "next/server";
import { keywordSearch } from "@/lib/search/keyword";
import { semanticSearch } from "@/lib/search/semantic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const mode = (url.searchParams.get("mode") ?? "keyword") as "keyword" | "semantic";
  if (!q) {
    return NextResponse.json({ error: "q_required" }, { status: 400 });
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

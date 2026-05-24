/**
 * OpenAI text-embedding-3-small wrapper.
 * 1536d · 服务端专用 · 不暴露给浏览器。
 */
import "server-only";

const MODEL = "text-embedding-3-small";

function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY missing");
  return k;
}

export async function embedText(input: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`openai embeddings ${r.status}: ${txt.slice(0, 200)}`);
  }
  const data = await r.json() as { data: Array<{ embedding: number[] }> };
  const vec = data.data?.[0]?.embedding;
  if (!vec || vec.length !== 1536) {
    throw new Error(`embed dim mismatch: got ${vec?.length}`);
  }
  return vec;
}

/** Compose embedding input from a video's metadata (bilingual). */
export function embedInputFromVideo(input: {
  title_zh: string; title_en: string;
  summary_zh?: string | null; summary_en?: string | null;
}): string {
  return [
    input.title_zh,
    input.title_en,
    input.summary_zh ?? "",
    input.summary_en ?? "",
  ].filter(Boolean).join("\n");
}

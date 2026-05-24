/**
 * Subtitle helpers: SRT parsing, YouTube caption fetch, transcript text.
 */
import "server-only";
import { readFile } from "node:fs/promises";
import type { SrtSegment } from "./ai/prompts/s3-timeline";

/** Parse SRT file text into segments. */
export function parseSrt(srt: string): SrtSegment[] {
  const blocks = srt.replace(/\r/g, "").split(/\n\n+/);
  const out: SrtSegment[] = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;
    const timing = lines.find((l) => /-->/.test(l));
    if (!timing) continue;
    const [a, b] = timing.split("-->").map((s) => s.trim());
    const start = srtTimeToSec(a);
    const end = srtTimeToSec(b);
    const text = lines.slice(lines.indexOf(timing) + 1).join(" ").trim();
    if (text) out.push({ start, end, text });
  }
  return out;
}

function srtTimeToSec(t: string): number {
  // 00:01:23,456
  const m = t.match(/^(\d+):(\d+):(\d+)[,.](\d+)$/);
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}

export async function readSrtFile(path: string): Promise<SrtSegment[]> {
  const txt = await readFile(path, "utf8");
  return parseSrt(txt);
}

/** Build a plain transcript (no timestamps) for S1 / S4. */
export function transcriptPlain(segments: SrtSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}

/** Build a transcript with [mm:ss] tags for S2 anchoring. */
export function transcriptWithTimestamps(segments: SrtSegment[]): string {
  return segments
    .map((s) => {
      const sec = Math.floor(s.start);
      const mm = Math.floor(sec / 60).toString().padStart(2, "0");
      const ss = (sec % 60).toString().padStart(2, "0");
      return `[${mm}:${ss}] ${s.text}`;
    })
    .join("\n");
}

/**
 * Fetch YouTube auto-caption via timedtext endpoint.
 * MVP: best-effort; returns null if unavailable (caller falls back to local SRT).
 */
export async function fetchYoutubeCaption(videoId: string, lang = "en"): Promise<SrtSegment[] | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const xml = await r.text();
    if (!xml.includes("<p")) return null;
    return parseYoutubeSrv3(xml);
  } catch {
    return null;
  }
}

function parseYoutubeSrv3(xml: string): SrtSegment[] {
  const out: SrtSegment[] = [];
  const re = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const start = +m[1] / 1000;
    const dur = +m[2] / 1000;
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    if (text) out.push({ start, end: start + dur, text });
  }
  return out;
}

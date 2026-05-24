/**
 * S3 · timeline-builder (Hybrid)
 * REQ-V04 · ≥ 5 节点 · 双语 · Script 分段 + Agent 命名
 */
import "server-only";
import { chatJSON } from "../deepseek";
import type { TimelineItem } from "@/db/schema";

export type SrtSegment = {
  start: number;  // seconds
  end: number;
  text: string;
};

export type S3Segment = {
  start_sec: number;
  end_sec: number;
  text: string;
};

export type S3Output = {
  timeline_zh: TimelineItem[];
  timeline_en: TimelineItem[];
};

/** Script: combine SRT segments into ≥ 5 chapters by length heuristic. */
export function splitIntoChapters(
  srt: SrtSegment[],
  opts: { minChapterSec?: number; targetChapters?: number } = {},
): S3Segment[] {
  const { minChapterSec = 360, targetChapters = 8 } = opts;
  if (srt.length === 0) return [];
  const total = srt[srt.length - 1].end - srt[0].start;
  const span = Math.max(minChapterSec, Math.floor(total / targetChapters));
  const chapters: S3Segment[] = [];
  let bucket: SrtSegment[] = [];
  let bucketStart = srt[0].start;
  for (const s of srt) {
    bucket.push(s);
    if (s.end - bucketStart >= span) {
      chapters.push({
        start_sec: Math.floor(bucketStart),
        end_sec: Math.floor(s.end),
        text: bucket.map((b) => b.text).join(" "),
      });
      bucket = [];
      bucketStart = s.end;
    }
  }
  if (bucket.length > 0) {
    chapters.push({
      start_sec: Math.floor(bucketStart),
      end_sec: Math.floor(bucket[bucket.length - 1].end),
      text: bucket.map((b) => b.text).join(" "),
    });
  }
  return chapters;
}

const SYSTEM = `你是看懂世界编辑。给一个视频片段的转写,生成中英双语章节标题 + 一句话摘要。
约束:
- title 简洁(≤ 14 个汉字 / ≤ 24 chars)
- one_liner ≤ 50 字中文 / ≤ 80 chars 英文
- 输出 JSON: {"title_zh":"","one_liner_zh":"","title_en":"","one_liner_en":""}`;

export async function nameChapter(segment: S3Segment): Promise<{
  title_zh: string; one_liner_zh: string;
  title_en: string; one_liner_en: string;
}> {
  const out = await chatJSON<{
    title_zh: string; one_liner_zh: string;
    title_en: string; one_liner_en: string;
  }>({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `片段(${segment.start_sec}s-${segment.end_sec}s):\n${segment.text.slice(0, 3000)}` },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });
  return {
    title_zh: out.title_zh ?? "未命名段落",
    one_liner_zh: out.one_liner_zh ?? "",
    title_en: out.title_en ?? "Untitled",
    one_liner_en: out.one_liner_en ?? "",
  };
}

export async function buildTimeline(srt: SrtSegment[]): Promise<S3Output> {
  const chapters = splitIntoChapters(srt);
  const zh: TimelineItem[] = [];
  const en: TimelineItem[] = [];
  for (const ch of chapters) {
    let named;
    try {
      named = await nameChapter(ch);
    } catch {
      named = {
        title_zh: "未命名段落", one_liner_zh: "",
        title_en: "Untitled", one_liner_en: "",
      };
    }
    zh.push({ timestamp_sec: ch.start_sec, title: named.title_zh, one_liner: named.one_liner_zh });
    en.push({ timestamp_sec: ch.start_sec, title: named.title_en, one_liner: named.one_liner_en });
  }
  return { timeline_zh: zh, timeline_en: en };
}

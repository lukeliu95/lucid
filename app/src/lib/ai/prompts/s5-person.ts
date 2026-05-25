/**
 * S5 · person-profile-aggregator (Agent)
 * REQ-P02 · 从该 person 所有视频聚合 3-5 条代表性观点 · 双语
 */
import "server-only";
import { chatJSON } from "../deepseek";
import type { SignatureView } from "@/db/schema";

export type S5VideoRef = {
  slug: string;
  title_zh: string;
  title_en: string;
  keypoints_zh: Array<{ text: string }>;
  keypoints_en: Array<{ text: string }>;
};

export type S5Input = {
  person_name_zh: string;
  person_name_en: string;
  videos: S5VideoRef[];
};

export type S5Output = {
  signature_views_zh: SignatureView[];
  signature_views_en: SignatureView[];
};

const SYSTEM = `你是明读的内容编辑。给一位人物的多条视频核心观点,提炼 3-5 条该人物的"代表性立场"。
约束:
- 每条标注 from_video_slug + from_video_title(选最能代表该立场的视频)
- 双语对应(同索引位是同一立场)
- 不虚构,只重组 + 概括已有 keypoints
- 输出 JSON: {"signature_views_zh":[{"quote":"...","from_video_slug":"...","from_video_title":"..."}], "signature_views_en":[...]}`;

export async function aggregatePerson(input: S5Input): Promise<S5Output> {
  const refs = input.videos.map((v, i) =>
    `[V${i}] slug=${v.slug}\n  zh-title: ${v.title_zh}\n  en-title: ${v.title_en}\n  keypoints_zh: ${v.keypoints_zh.map((k) => k.text).join(" | ")}\n  keypoints_en: ${v.keypoints_en.map((k) => k.text).join(" | ")}`,
  ).join("\n\n");
  const user = `人物: ${input.person_name_zh} / ${input.person_name_en}\n\n所有视频观点:\n${refs}\n\n输出 JSON。`;
  return chatJSON<S5Output>({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 1500,
  });
}

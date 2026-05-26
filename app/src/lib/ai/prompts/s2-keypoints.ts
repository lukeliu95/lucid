/**
 * S2 · keypoints-extractor (Agent)
 * REQ-V03 · 5-10 条核心观点 · 双语 · 防幻觉
 */
import "server-only";
import { chatJSON } from "../deepseek";
import type { KeyPoint } from "@/db/schema";

export type S2Input = {
  transcript_with_timestamps: string;  // "[mm:ss] ..." lines
};

export type S2Output = {
  keypoints_zh: KeyPoint[];
  keypoints_en: KeyPoint[];
};

const SYSTEM = `你是明读的内容编辑。从访谈/演讲转写中抽取 5-10 条核心观点,中英双语对应。
硬性约束:
- 禁止虚构。每条 keypoint 必须能在 transcript 找到锚点
- source_span 字段 = 原文中能支撑该观点的连续片段(≤ 30 字英文或 ≤ 20 字中文)
- 如某条观点找不到锚点 → 直接丢弃
- keypoints_zh 与 keypoints_en 一一对应(同索引位是同一条观点)
- 若文中有时间戳 [mm:ss],把该锚点出现位置的 mm:ss 转秒数写入 timestamp_sec

输出 JSON:
{
  "keypoints_zh": [{"text":"...","timestamp_sec":120,"source_span":"..."}, ...],
  "keypoints_en": [{"text":"...","timestamp_sec":120,"source_span":"..."}, ...]
}`;

export async function extractKeypoints(input: S2Input): Promise<S2Output> {
  const user = `转写(含时间戳):\n${input.transcript_with_timestamps.slice(0, 12000)}\n\n现在输出 JSON。`;
  const out = await chatJSON<S2Output>({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });
  // anchor verification: drop items whose source_span is not present in transcript.
  // 归一化后匹配 —— 去掉 [mm:ss] 时间戳标记 / 空白 / 标点(中英文),再做包含判断。
  // 否则中文自动字幕(噪声大、标点空格不一)会让合法引文对不上而被全部丢弃。
  const norm = (s: string) =>
    s.replace(/\[\d+:\d+(?::\d+)?\]/g, "").replace(/\s+/g, "").replace(/\p{P}/gu, "");
  const nc = norm(input.transcript_with_timestamps);
  const filter = (k: KeyPoint) => !k.source_span || nc.includes(norm(k.source_span));
  return {
    keypoints_zh: (out.keypoints_zh ?? []).filter(filter).slice(0, 10),
    keypoints_en: (out.keypoints_en ?? []).filter(filter).slice(0, 10),
  };
}

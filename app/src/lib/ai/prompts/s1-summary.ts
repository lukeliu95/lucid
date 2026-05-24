/**
 * S1 · summary-generator (Agent)
 * REQ-V02 · ≤80 字双语一句话总结
 */
import "server-only";
import { chatJSON } from "../deepseek";

export type S1Input = {
  transcript: string;
  video_title: string;
};

export type S1Output = {
  summary_zh: string;
  summary_en: string;
};

const SYSTEM = `你是看懂世界的内容编辑助手。任务: 给一段访谈/演讲转写生成一句话总结,中英双语。
约束:
- summary_zh ≤ 80 个汉字
- summary_en ≤ 120 个英文字符
- 必须客观,不加情绪
- 抓"这个视频在讨论什么 + 主要立场",不写"本视频讲述了"等套话
- 输出 JSON: {"summary_zh": "...", "summary_en": "..."}`;

export async function generateSummary(input: S1Input): Promise<S1Output> {
  const user = `视频标题: ${input.video_title}\n\n转写(节选,前 6000 字):\n${input.transcript.slice(0, 6000)}\n\n现在输出 JSON。`;
  const out = await chatJSON<S1Output>({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_tokens: 400,
  });
  if (!out.summary_zh || !out.summary_en) {
    throw new Error("S1: missing summary fields");
  }
  return {
    summary_zh: out.summary_zh.slice(0, 100),  // hard cap
    summary_en: out.summary_en.slice(0, 160),
  };
}

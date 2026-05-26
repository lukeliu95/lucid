/**
 * S4 · two-tier-explainer (Agent)
 * REQ-V05 · 2 档解释 · 双语 · 单调用 JSON 模式
 */
import "server-only";
import { chatJSON } from "../deepseek";

export type S4Input = {
  transcript: string;
  summary_zh?: string;
  summary_en?: string;
};

export type S4Output = {
  explainer_quick_zh: string;
  explainer_quick_en: string;
  explainer_deep_zh: string;
  explainer_deep_en: string;
};

const SYSTEM = `你是明读的内容编辑。给一段视频转写,生成 2 档解释(成人速懂 + 深度版),中英双语。
约束:
- explainer_quick_zh: 200-300 字 · 用日常语言告诉成年观众视频在讲什么 · 不能照搬原话
- explainer_quick_en: 250-400 chars · 同义,自然英文
- explainer_deep_zh: **1000-1200 字(务必不少于 1000 字)** · 一篇能 5 分钟读完、对视频有整体了解的导读文章 · 分 3-5 段(段间空一行)· 结构:开篇交代是谁/什么场合 → 核心主张与背景 → 关键论据/案例 → 反方或局限 → 收束 · 用大白话,不照搬原话,不堆术语
- explainer_deep_en: **600-800 words** · 与中文信息量等价的自然英文文章,同样分段,5 分钟读完
- 严格双语对应(信息量等价,不是逐字翻译)
- 段落之间用 \\n\\n 分隔
- 输出 JSON: {"explainer_quick_zh":"...","explainer_quick_en":"...","explainer_deep_zh":"...","explainer_deep_en":"..."}`;

export async function generateExplainer(input: S4Input): Promise<S4Output> {
  const user = `${input.summary_zh ? `已有一句话总结(中): ${input.summary_zh}\n` : ""}${
    input.summary_en ? `One-liner (en): ${input.summary_en}\n` : ""
  }\n转写(节选):\n${input.transcript.slice(0, 10000)}\n\n现在输出 JSON。`;
  const out = await chatJSON<S4Output>({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    temperature: 0.5,
    max_tokens: 6000,
  });
  if (!out.explainer_quick_zh || !out.explainer_deep_zh) {
    throw new Error("S4: missing explainer fields");
  }
  return out;
}

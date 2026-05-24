# S1 Summary Eval (Seeded)

> Skill: `s1-summary-generator` · `app/src/lib/ai/prompts/s1-summary.ts`
> 接口: `{transcript, video_title} → {summary_zh ≤80 字, summary_en ≤120 chars}`

## Rubric (deterministic + LLM rubric)

**Deterministic checks**:
- `summary_zh.length ≤ 80`(字)
- `summary_en.length ≤ 120`(chars)
- `summary_zh` 非空 & 非纯英文
- `summary_en` 非空 & 非纯中文
- 返回为合法 JSON object

**LLM rubric**(judge prompt 见 README)按 5 维度评 1-5 分。

## Cases

### C1 · Sam Altman Lex #419(AI/AGI 主题)
- input.video_title: "Sam Altman on GPT-5 & AGI · Lex Podcast #419"
- input.transcript: [前 5000 tokens 节选 · 见 memory/knowledge/transcripts/sam-altman-lex-419.txt]
- 预期 zh 含: "GPT-5" / "AGI" / "OpenAI" 至少 2 个
- 预期 en 含: "GPT-5" / "AGI" / "OpenAI" 至少 2 个
- 反 hallucination: 不得提及未在 transcript 出现的产品名(e.g. "GPT-6")

### C2 · Karpathy LLM intro(技术教育)
- video_title: "Karpathy · Intro to LLMs (1h)"
- 预期 zh: 提及 "tokenization" / "训练" / "推理" 至少 1 个
- 反: 不得说错 transformer 架构细节

### C3 · Naval How to Get Rich(商业哲学)
- 预期 zh: 提及 "财富" 或 "运气" 或 "杠杆"
- 反: 不得归因到错误人物

### C4 · 边界 · 极短 transcript (5 分钟视频)
- 预期: zh ≤ 80 字仍可总结 · 不抱怨内容不足

### C5 · 边界 · 中英混合 transcript
- 预期: zh 摘要纯中文 · en 摘要纯英文 · 不串

## 通过线

pass@5 ≥ 0.85 · pass^5 ≥ 0.60 · rubric avg ≥ 4.0

# S2 Keypoints Eval (Seeded)

> Skill: `s2-keypoints-extractor` · `app/src/lib/ai/prompts/s2-keypoints.ts`
> 接口: `{transcript_with_timestamps} → {keypoints_zh[], keypoints_en[]}` 5-10 条 · 各 `{text, timestamp_sec?, source_span}`

## Rubric

**Deterministic**:
- 5 ≤ len(keypoints_zh) ≤ 10
- 5 ≤ len(keypoints_en) ≤ 10
- len(keypoints_zh) == len(keypoints_en)(一一对应)
- **每条 source_span 必须是 transcript 子串**(字符串 contains 验证)— 这是反 hallucination 核心
- 每条 text 长度 ≤ 100 字 / 150 chars

**LLM rubric**:
- 锚点真实性(deterministic 已覆盖,rubric 二次确认语义)
- 5-10 条都是核心观点而非琐碎细节
- 双语对应性

## Cases

### C1 · Sam Altman Lex #419(完整长 transcript)
- 预期 keypoints 提及: AGI 时间表 / 安全 / 商业化 / 开源 至少 3 个
- 反: source_span 必须真存在

### C2 · Karpathy Intro to LLMs
- 预期: tokenization / pretraining / fine-tuning / inference 至少 3 个

### C3 · Naval How to Get Rich(说理为主)
- 预期: 杠杆 / 复利 / 专业知识 / 运气 类至少 3 个

### C4 · 边界 · 短 transcript(20 分钟内容)
- 即使内容少也至少 5 条 keypoints

### C5 · 反 hallucination 红队 case
- 测: prompt 中故意暗示 "Andreessen 说 software 4.0",但 transcript 是 3.0
- 通过条件: skill 不应被诱导虚构 4.0,source_span 必须忠实

## 通过线: pass@5 ≥ 0.85 · pass^5 ≥ 0.55(反 hallucination 要求高)· rubric avg ≥ 4.0

# S4 Two-Tier Explainer Eval (Seeded)

> Skill: `s4-two-tier-explainer`
> 输出 4 字段: explainer_quick_zh (200-300 字) / quick_en (250-400 chars) / deep_zh (800-1500 字) / deep_en (1000-2000 chars)

## Rubric

**Deterministic**:
- explainer_quick_zh: 200 ≤ len ≤ 300 字
- explainer_quick_en: 250 ≤ len ≤ 400 chars
- explainer_deep_zh: 800 ≤ len ≤ 1500 字
- explainer_deep_en: 1000 ≤ len ≤ 2000 chars
- deep 字数 > quick 字数 × 3(确保双档差异化)

**LLM rubric**:
- quick 档: 通俗易懂 · 不堆术语 · 一气呵成
- deep 档: 比 quick 多深度 · 不重复 quick · 包含背景 / 原理 / 影响
- 双语对应

## Cases

### C1 · 技术深内容(Karpathy LLM)
- quick: 必须让非 AI 背景读者懂
- deep: 可深入 transformer / attention 等术语

### C2 · 商业内容(Stripe / Collison)
- quick: 不用商业行话
- deep: 可用 fintech / take-rate 等

### C3 · 哲学内容(Naval)
- quick: 一句话凝练核心 insight
- deep: 引用具体论证链

### C4 · 边界 · transcript 内容稀疏
- 不应在 deep 强行 padding 到 1500 字 · 落到 800-1000 OK

### C5 · 反 padding red team
- 测: skill 是否会因要求字数而注水
- 通过: deep 必须含 quick 没有的 ≥ 3 个新信息点(rubric 评)

## 通过线: pass@5 ≥ 0.80 · pass^5 ≥ 0.55 · rubric avg ≥ 4.0

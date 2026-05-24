# S5 Person Aggregator Eval (Seeded)

> Skill: `s5-person-profile-aggregator`
> 接口: 该 person 的多视频 keypoints + summary → `{signature_views_zh[], signature_views_en[]}` 3-5 条

## Rubric

**Deterministic**:
- 3 ≤ len(signature_views_zh) ≤ 5
- 双语对应数相等
- 每条 SignatureView 含 `source_video_slugs[]`(非空 · 必须是真实 video slug)
- text ≤ 150 字 / 200 chars

**LLM rubric**:
- 3-5 条覆盖该人物核心立场
- 每条都能从源视频找到支撑
- 不混入其他人物观点
- 双语对应

## Cases

### C1 · Sam Altman(8 个视频 source)
- 预期 view 含: AGI 时间表 / 商业化 / 安全
- 反: 不混入 Dario / Karpathy 观点

### C2 · Karpathy(6 视频)
- 预期: 教育 / 软件 3.0 / LLM 本质

### C3 · Naval(4 视频)
- 预期: 杠杆 / 复利 / 专业知识

### C4 · 边界 · 只有 1 个视频
- 3-5 条要求是否合理 · 通过: 至少 3 条 · 不强 5
- skill 应不报错

### C5 · 反混淆 · 同主题不同人物
- 输入故意混入 Dario 的关键点
- 通过: skill 应只采该 person 自己 transcript 来源的观点(source_video_slugs 排他)

## 通过线: pass@5 ≥ 0.80 · pass^5 ≥ 0.50 · rubric avg ≥ 3.8

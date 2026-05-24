# S3 Timeline Eval (Seeded)

> Skill: `s3-timeline-builder`(Hybrid · Script 切段 + Agent 命名)
> 接口: SRT segments → `{timeline_zh[], timeline_en[]}` · 5-12 段 · 每段 `{timestamp_sec, title, one_liner}`

## Rubric

**Deterministic**:
- 5 ≤ len(segments) ≤ 12
- segments[i].timestamp_sec < segments[i+1].timestamp_sec(单调递增)
- title 长度 ≤ 30 字 / 50 chars
- one_liner 长度 ≤ 100 字 / 150 chars
- 第一段 timestamp_sec ≤ 60(开篇 1 分钟内)
- 最后一段 timestamp_sec ≤ video_duration_sec - 30

**LLM rubric**:
- 分段合理性(intent §6.2: 时间轴可用率 ≥ 80%)
- 段名概括力 vs 内容
- 双语对应

## Cases

### C1 · 120 分钟长访谈(Sam Altman Lex)
- 预期 8-12 段
- 段切分应跟随话题转换

### C2 · 30 分钟短演讲(TED)
- 预期 5-7 段
- 不强行切到 12 段

### C3 · 60 分钟教育视频(Karpathy)
- 段名应反映知识递进(基础 → 进阶 → 应用)

### C4 · 边界 · 极短 15 分钟视频
- 至少 5 段(可能段长很短)
- 不应只切 1-2 段

### C5 · 反单调 case · 无明显话题转换的连续讲述
- skill 应能按 6 min 窗口启发式切段
- 不应卡死或返 1 段

## 通过线: pass@5 ≥ 0.80 · pass^5 ≥ 0.50 · rubric avg ≥ 3.8

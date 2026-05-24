# LLM Eval 执行计划 · 25 cases × DeepSeek-v4-pro

## 目标

验证 **北极星 N1**: LLM 摘要准确率 ≥ 85%(intent-brief §6.2)。

## 谁跑

**Alan 一人执行**,在 Vercel 部署完 + ingest 30 视频跑完之后(deployment-runbook Step 8)。

## 怎么跑

### 一次性命令

```bash
cd app
DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/llm-eval-suite/run-all.ts \
  --output docs/04-evolve/round-001/llm-eval-results.json
```

### 案例分布(已在 Phase C seeded)

| Skill | Cases | 重点 |
|---|---|---|
| S1 summary-generator | 5 | 摘要不丢核心 |
| S2 keypoints-extractor | 5 | **反 hallucination**(给一个不存在的论点,看 LLM 是否硬编)|
| S3 timeline-builder | 5 | 时间戳准确率 |
| S4 two-tier-explainer | 5 | **反 padding**(简单档不要堆词)|
| S5 person-aggregator | 5 | **反混淆**(嘉宾 A 的观点不要算到嘉宾 B 头上)|

每个 case 3 trials(`trials_per_case: 3` · pipeline-state.json)。

## 评分

- Rubric: `docs/03-qualify/evaluation-framework.md` 已定义
- pass 标准: 单 case 在 3 次 trial 中 ≥ 2 次得分 ≥ 0.85(`threshold: 85` · pipeline-state.json)
- 整体合格: 25 cases 中 ≥ 21 pass(84% pass rate ≈ 85% 准确率)

## 失败处理(若 < 85%)

### 不改接口,只改 prompt

1. 看 results JSON 找 fail cases · 按 skill 分组
2. 看 fail 原因:
   - 漏 key point → prompt 强化「列出所有 X、Y、Z」
   - hallucinate → prompt 加「如果原文没说,直接写「未提及」,不要推测」
   - 时间戳偏 → prompt 加「时间戳必须来自 transcript 的 timestamp 字段,不要估算」
3. 改 `app/skills/<skill>/SKILL.md` 的 prompt 部分
4. 重跑该 skill 的 5 case
5. 全 PASS → 整体重跑 25 case 确认无回归

### 收敛标准

- 改 ≤ 3 次 prompt 后达标 → 上线 v0.1 + 写复盘
- 改 ≥ 4 次仍不达标 → 退回评估 model 选择(可能要换 deepseek-v4-reasoning 或加 retrieval),记录到 Phase D round-002 议题

## 时间预算

- 25 cases × 3 trials × ~$0.005/调用 ≈ **$0.40**
- 单次跑完 25 × 3 ≈ 30-45 分钟(取决于 DeepSeek 限流)
- 若需调 prompt 重跑,加 30 分钟/轮

## 产出归档

`docs/04-evolve/round-001/llm-eval-results.json`(原始)+ `llm-eval-summary.md`(人读版,Alan 跑完后写)。

---

*老吴 · 2026-05-25*

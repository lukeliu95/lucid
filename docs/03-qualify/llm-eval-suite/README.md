# LLM Eval Suite (Seeded · Not Executed)

> 2026-05-24 · 阿May
> 5 个核心 skill 各 5 case 的 eval rubric + prompt + 预期输出。
> **本轮不真跑**(无 API key 在子会话可用 + 烧 token 预算 + ai_status 全 pending) · 留给 Phase D 老吴上线后用真 DEEPSEEK_API_KEY 跑。

## 文件

| File | Skill | Cases |
|---|---|---|
| s1-summary-eval.md | s1-summary-generator | 5 |
| s2-keypoints-eval.md | s2-keypoints-extractor | 5 |
| s3-timeline-eval.md | s3-timeline-builder | 5 |
| s4-explainer-eval.md | s4-two-tier-explainer | 5 |
| s5-person-eval.md | s5-person-profile-aggregator | 5 |

## 共用 rubric 维度(基于 evaluation-framework.md)

| Dim | 5分 | 1分 |
|---|---|---|
| 准确性 | 完全忠实于 transcript 无虚构 | 关键事实错或虚构来源 |
| 完整性 | 覆盖核心论点 | 漏 >50% 核心论点 |
| 格式合规 | 字段 / 字数 / 类型完全合规 | 任一硬约束破 |
| 双语一致 | zh/en 语义对应 + 字数合规 | 翻译漂移或单语缺失 |
| 实用性 | 用户 2 分钟看懂 | 抽象 / 模板化 / 无信息量 |

权重: 准确性 30% · 完整性 25% · 格式 20% · 双语 15% · 实用性 10%

## 通过线

- pass@k(5 trials,至少 1 次过)≥ 85%
- pass^k(5 trials 都过)≥ 60%
- rubric avg ≥ 4.0 / 5(= 80%)

## 执行方式(Phase D)

```bash
# 准备 .env.local 含 DEEPSEEK_API_KEY
cd app
DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/scripts/run-llm-eval.ts --skill s1 --cases docs/03-qualify/llm-eval-suite/s1-summary-eval.md --trials 5
```

(注: `run-llm-eval.ts` 待 Phase D 老吴写 · MVP 不实现)

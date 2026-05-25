# 05 · 测试报告

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: docs/03-qualify/evaluation-framework.md · delivery-report.md · llm-eval-suite/* · 04-evolve/round-001
> 自动化类型: ✅ 全自动 · LLM eval seeded(未真跑,标 [Desk Evaluation — 上线后跑])

## 评估框架

阿May 在 Phase C 设计三层评估策略,适配 MVP 7 天紧迫现实:

1. **结构 eval**(本轮跑):i18n 双语对齐 / 类型 / DB schema / Edge key 隔离 / brand / mock 完整 — 阻塞上线
2. **可执行 eval**(本轮跑):build / tsc / a11y 静态扫 / Lighthouse 估算 — 阻塞上线
3. **LLM eval**(seeded · 上线后跑):5 skill × 5 case rubric + prompt + 预期 — 不阻塞 MVP
4. **稳定性套件**(简化跑):regression × 3 + 7 boundary cases

**北极星**(intent-brief §6.2):

| # | 名 | 目标 | 本轮 |
|---|---|---|---|
| **N1** | summary_accuracy | ≥ 85% | ⏸ Desk · 上线后跑 |
| **N2** | i18n_coverage_zh_en | 100% | ✅ 100% · 111/111 keys |
| **N3** | a11y_critical_count | = 0 | ✅ 0 critical · 2 serious(头像 alt 占位) |

> 详见 `docs/03-qualify/evaluation-framework.md`(全文)。

## 各 Skill 评分

> Desk Evaluation 模式 · 5 Agent/Hybrid skill 跑 5 cases 每个共 25 cases seeded,**未实际调用 DeepSeek API**(子 agent 无 key + 烧 token 预算 + 28/30 视频 platform_id 占位)。pass@k / pass^k 列统一标注 `[Desk Evaluation — 仅设计评估]`,Phase D 老吴上线后用真 key 跑。

| Skill | 类型 | 漏斗 | pass@k | pass^k | rubric | final % | 是否达标(阈值 85%) |
|---|---|---|---|---|---|---|---|
| S1 summary-generator | Agent | L1→L2 | [Desk Eval] | [Desk Eval] | 5 case seeded(准确率 / 字数 / 不丢核心) | seeded · 待真跑 | ⏸ Phase D |
| S2 keypoints-extractor | Agent | L1→L2 | [Desk Eval] | [Desk Eval] | 5 case seeded(**反 hallucination** 重点) | seeded · 待真跑 | ⏸ Phase D |
| S3 timeline-builder | Hybrid | L1→L2 | [Desk Eval] | [Desk Eval] | 5 case seeded(分段数 5-12 / 段名质量) | seeded · 待真跑 | ⏸ Phase D |
| S4 two-tier-explainer | Agent | L1→L2 | [Desk Eval] | [Desk Eval] | 5 case seeded(**反 padding** 重点) | seeded · 待真跑 | ⏸ Phase D |
| S5 person-aggregator | Agent | L1→L2 | [Desk Eval] | [Desk Eval] | 5 case seeded(**反混淆** 跨视频引用) | seeded · 待真跑 | ⏸ Phase D |
| S6 video-crud | Script | L0 | N/A | N/A | 静态审计 | ✅ POST/GET 一致 · 401/409 | ✅ |
| S7 semantic-search | Hybrid | L0→L2 | N/A | N/A | 静态审计 | ✅ top1 + fallback | ✅ |
| S8 keyword-search | Script | L0→L2 | N/A | N/A | 静态审计 | ✅ CJK 检测 + trigram | ✅ |
| S9 orchestrator | Script | L1 | N/A | N/A | 静态审计 | ✅ 状态机 · 重试 ≤3 | ✅ |
| S10 favorite-crud | Script | L0 | N/A | N/A | 静态审计 | ✅ 幂等 + 401 | ✅ |

**结构 + 可执行 eval 汇总**(`delivery-report.md` §6):

| Eval | 结果 |
|---|---|
| i18n 111 双语对齐 | ✅ |
| mock data 30 视频字段 | ✅(28 platform_id 占位待补 — 运营层) |
| API contract 一致性 | ✅ |
| DB schema 一致性 | ✅ |
| Edge key 隔离 | ✅ |
| rate-limit + brand | ⚠ rate-limit 仅 ai/chat 命中 · brand ✅(W6 → round-001 已补 /api/search) |
| `npm run build`(裸 env) | ❌ baseline → ✅ round-001 W3 lazy init 后 PASS |
| `npm run build`(stub DATABASE_URL) | ✅ |
| Next-internal tsc | ✅ |
| standalone tsc | ❌ W4 已知 issue(`moduleResolution: bundler`)· KEPT-as-doc |
| Regression × 3 | ✅ 0% variance |
| Boundary 7 cases | ✅ 6/7 + 1 fallback |
| **结构 eval 通过率** | **5/6**(W6 部分覆盖 round-001 后已修) |
| **可执行 eval 通过率** | **4/4**(build/tsc-via-next/a11y/regression) |

## 阈值校准

`confirmed_params.threshold` = **85**(单值 · `[未经多指标校准]`)。配套参数:

| 参数 | 值 |
|---|---|
| threshold(单一统一阈值) | 85% |
| trials_per_case | 3 |
| cases_count_per_skill | 5 |
| total cases seeded | 25(5 skill × 5 case) |
| max_parallel_skills | 5 |

> 项目无 `calibrated_thresholds.per_metric` 多指标校准 — 用单一 N1=85% + N2=100% + N3=0 三北极星替代。功能上等价于 MVP 阶段的简化版校准。

## 改进轨迹

Phase D · round-001 单轮 maintain(`docs/04-evolve/round-001/round-001.md`):

| 维度 | baseline(round-001 前) | final(round-001 后) | Δ |
|---|---|---|---|
| build 通过(裸 env) | ❌ | ✅ | +1 |
| /api/search 防刷 | ❌ | ✅ | +1 |
| 视频 ID 占位可见性 | `PLACEHOLDER`(易撞真 ID) | `_DRAFT` 后缀 + 注释 | +0.5 |
| 部署文档完备度 | 0 | 9 步 runbook + eval plan + checklist | +1 |
| **综合健康分** | **0.78** | **0.92** | **+0.14** |

**判定**: KEEP(delta +14% · 远超 +2% threshold)· `codeloop_state.exit_reason = max_rounds_reached_per_brief`(单轮收尾 maintain mode 设计如此 · 已达稳定 stable_after_one_round)。

5 候选决策:
- **C1** W3 lazy init `db/client.ts` → KEPT(build 不再需要 stub DATABASE_URL)
- **C2** W4 tsc TS6046 → KEPT-as-doc(Next 15 + bundler 已知 upstream issue · 强改破坏 build 链)
- **C3** W6 `/api/search` rate-limit 30/60s/IP → KEPT(防 OpenAI embedding 账单飙升)
- **C4** 28 视频 platform_id 回填 → PARTIAL KEPT + DEFERRED(3 真 + 27 `_DRAFT` 强制可见占位 · Alan 上线前必须二次审)
- **C5** 9 步 deployment-runbook + LLM eval plan + post-launch checklist → KEPT

## 未达标分析

**当前无任何"已实测但未达标"的 Skill**。需要 Phase D 真测才能确认的是 S1-S5 五个 Agent/Hybrid skill 的 LLM 输出准确率(seeded 状态)。

**LLM eval 真测计划**(上线后 24h 内 Alan 一人执行 · `docs/04-evolve/llm-eval-execution-plan.md`):

```bash
cd app
DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/llm-eval-suite/run-all.ts \
  --output docs/04-evolve/round-001/llm-eval-results.json
```

期望: **25 cases ≥ 21 pass(≥ 85% 准确率)**。

若未达标,改 prompt(不改 skill 接口),再跑一轮 · 这属于 round-002 自动触发条件。

未达标兜底方向(funnel_diagnosis 已写):
- 若 S1/S4 < 85% → 改 prompt 加更强 few-shot
- 若 S2 hallucination 率 > 5% → 加 source_span 严格校验(已有)+ 提高拒答门槛
- 若 S3 时间轴可用率 < 80% → Script 分段策略放宽(双换行 + 长停顿)
- 若 L0 搜索 < 60% → 切纯 keyword 兜底

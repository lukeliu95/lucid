# Evaluation Framework · kdsj-world Phase C

> 阿May(质量工程师 · 老周架构师顾问) · 2026-05-24
> 项目: kdsj-world(看懂世界)· MVP 7 天紧迫现实
> Pipeline: hybrid(10 backend skills + 18 UI components + 4 pages + i18n zh/en)
> Source-of-truth: `docs/01-discover/intent-brief.md` §6.2 · `docs/01-discover/requirements-spec.md` 21 REQ · `docs/design/handoff-to-engineering.md` 性能预算

---

## 1. MVP 现实化策略(Why this framework looks different)

**真实约束**:
- 子 agent 会话无法访问 DeepSeek / OpenAI API key(主会话外不可见 + 烧 token 预算)
- 30 视频中实际只有 1 条 platform_id 真实(`sam-altman-lex-419` = `jvqFAi7vkBc`),其余 29 条为 `PLACEHOLDER*`
- ai_status 全 `pending` · 没有真实 LLM 输出可评分
- 5-31 上线倒计时 · "找出真正阻塞上线的问题" > "100% 完美评估"

**因此采用三层策略**:

| 层 | 内容 | 阻塞上线? | 状态 |
|---|---|---|---|
| 1. 结构 eval | 静态可跑(i18n / type / schema / key 隔离 / brand / mock 完整) | 是 | 本轮跑 |
| 2. 可执行 eval | build / tsc / a11y 静态扫 / Lighthouse 估算 | 是 | 本轮跑 |
| 3. LLM eval(种子) | 5 skill × 5 case rubric + prompt + 预期 | 否(上线后跑) | 写完留种 |
| 4. 稳定性套件 | regression × 3 + boundary | 否 | 简化跑 |

LLM eval **不真跑** 但完整写,Phase D 老吴上线后用真 key 跑。

---

## 2. 价值漏斗(L0 → L3)

```
L0 输入 · 用户搜索 / 点击 / 字幕摄入
   ↓
L1 处理 · ASR / DeepSeek 4 skill / pgvector
   ↓
L2 输出 · 卡片 / 摘要 / 时间轴 / 双语 UI
   ↓
L3 价值 · "两分钟看懂" · 转发 / 自用
```

| 层 | 关键 skill / 组件 | 北极星候选 |
|---|---|---|
| L0 | s8-keyword-search · s7-semantic-search · search-bar | search_top1_relevance |
| L1 | s1/s2/s3/s4/s5 · pipeline-orchestrator | summary_accuracy(北极星) |
| L2 | video-detail · keypoints-list · timeline-nav · two-tier-tabs · i18n | i18n_coverage_100(北极星) |
| L3 | footer · share · favorite · twitter 链接 | day1_clicks(D 阶段评) |

诊断链:
- 若 L2 双语切换 100% 漏 → 直接阻塞上线(intent-brief §6.2 第 4 条硬约束)
- 若 L1 summary 准确率 < 85% → 改 prompt(不改 skill 接口)
- 若 L0 search 低于 60% → 切纯 keyword 兜底

---

## 3. 北极星指标(2-3 个)

| # | 名 | level | 漏斗层 | 目标 | 当前 baseline | 本轮可测? |
|---|---|---|---|---|---|---|
| N1 | summary_accuracy | north_star | L1→L2 outcome | ≥ 85%(intent §6.2) | 待 Phase D 真跑 | ❌(留种) |
| N2 | i18n_coverage_zh_en | north_star | L2 outcome | 100% | 100%(本轮验证) | ✅ |
| N3 | a11y_critical_count | north_star(质量守门) | L2 outcome | = 0 | 0(静态扫) | ✅ |

---

## 4. 各 Skill 指标体系简表

| Skill | type | 漏斗 | 主指标 | 检查方式 | 本轮 |
|---|---|---|---|---|---|
| S1 summary | Agent | L1→L2 | 准确率 / 幻觉率 / 字数合规 | rubric + det | seeded |
| S2 keypoints | Agent | L1→L2 | source_span 锚点真伪 / 5-10 条范围 | det + rubric | seeded |
| S3 timeline | Hybrid | L1→L2 | 分段数 ≥5 ≤12 / 段名质量 | det + rubric | seeded |
| S4 explainer | Agent | L1→L2 | quick 200-300 字 / deep 800-1500 字 / 双档差异化 | det + rubric | seeded |
| S5 person aggregate | Agent | L1→L2 | 3-5 观点 / 跨视频引用真伪 | det + rubric | seeded |
| S6 video-crud | Script | L0 | POST/GET 一致性 / 401/409 | det | 静态审计 |
| S7 semantic-search | Hybrid | L0→L2 | top1 相关性 / fallback OK | det | 静态审计 |
| S8 keyword-search | Script | L0→L2 | CJK 检测 / trigram 命中 | det | 静态审计 |
| S9 orchestrator | Script | L1 | 状态机正确性 / 重试 ≤3 | det | 静态审计 |
| S10 favorite-crud | Script | L0 | 幂等 / 401 | det | 静态审计 |

---

## 5. 质量守门配对

| 效率指标 | 配对质量守门 |
|---|---|
| $0.017/视频 成本 | 准确率 ≥ 85% |
| LCP 1.8s | a11y critical = 0 |
| Bundle 139KB | i18n coverage 100% |

---

## 6. 评估覆盖矩阵(本轮 vs Phase D)

| 维度 | 本轮(C) | Phase D(老吴) |
|---|---|---|
| 结构(i18n / type / brand / schema) | ✅ 跑 | 回归 |
| 静态 a11y(role / aria / kbd) | ✅ 扫 | 真实 axe-core |
| Build / tsc | ✅ 跑 | CI 跑 |
| Lighthouse | 估算(代码层) | Vercel 真跑 |
| LLM eval(S1-S5) | seeded 不跑 | 真 key 跑 + improve |
| Soak / load | 不跑(无 backend) | 跑 |


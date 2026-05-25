# 07 · 架构决策记录 (ADR)

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: reflections · alan_late_call_phase_a · evolve round-001 · skills-spec · confirmed_params · requirements-spec(8 数据源综合)
> 自动化类型: ✅ 全自动(v4.4+)

## 关键决策清单(流程 Reflection)

> 来源: `pipeline-state.reflections[]`(5 个 checkpoint)

| Checkpoint | 决策 | Reasoning(节选) |
|---|---|---|
| A · Discover | CONTINUE | 21 REQ / 10 skill / 12 UI / 30 视频清单完整 · scope_complete=true · 双语约束已贯穿 DB 拆 zh/en 双字段 · 老周裁决项(Auth/ORM/embedding/i18n)Alan 现场拍板替代 |
| B.0 · Design | CONTINUE | Mia 4 页 wireframes + 高保真 HTML + 88 tokens + 110 i18n keys + 16 components + handoff-to-engineering · Stage E all-pass(可行性 / 可用性 / 双语 / 版权 4 道) |
| B.1+B.2 · Build | CONTINUE | 小赵 6 页 18 组件 build PASS · LCP 1.8s / bundle 139KB · 大刘 10 skill 9 API 9 表 tsc PASS · key 隔离 0 泄漏 · $0.017/视频 · $0.51 全量 |
| C · Qualify | FINALIZE | 工程层全过(build/tsc/a11y critical=0/i18n 100%/stability)· 25 cases seeded 待 Phase D 真测 · 3 concerns 全是运营/上线前补救 · ready_to_deploy |
| D.1 · Evolve | COMPLETE | round-001 maintain 单轮 · 5 候选 4 KEPT 1 DEFERRED · W3 lazy init + W4 标注 + W6 rate-limit + 3 真 YT ID + 27 _DRAFT · 9 步 runbook + eval plan + checklist · final_score 0.92 |

## 需求类型分类决策(Agent / Script / Hybrid)

> 来源: `requirements-spec.md` 需求分解表 + `skills-spec.md` 10 个 skill 的 type 字段

| 需求 ID | 描述 | 分类 | 对应 Skill | 为什么这么分 |
|---|---|---|---|---|
| REQ-V02 | 一句话总结 | **Agent** | S1 | 需要 LLM 语义压缩 · 无确定算法 |
| REQ-V03 | 核心观点 5-10 条 | **Agent** | S2 | LLM 抽取 + 反 hallucination · `source_span` 锚点校验是 deterministic 兜底 |
| REQ-V04 | 时间轴 ≥5 节点 | **Hybrid** | S3 | Script 按 ≥6min 滑窗 + 语义停顿分段(deterministic)· Agent 给每段命名 |
| REQ-V05 | 2 档解释 | **Agent** | S4 | 字数规则 deterministic · 但内容生成必须 LLM |
| REQ-P02 | 人物代表观点 | **Agent** | S5 | 跨视频聚合 + 抽取代表性 · LLM 必须 |
| REQ-X01 | 视频 CRUD | **Script** | S6 | 纯 DB 写入 + Clerk auth gate |
| REQ-S01 | 关键词搜索 | **Script** | S8 | Postgres ILIKE / ts_vector · 0 LLM |
| REQ-S02 | 语义搜索 | **Hybrid** | S7 | OpenAI embedding(Agent 调用)+ pgvector cosine(Script) |
| (编排) | AI 流水线编排 | **Script** | S9 | 状态机 + 重试 + Promise.all fan-out · 0 LLM 决策 |
| REQ-U02/U03 | 收藏 CRUD | **Script** | S10 | 纯 DB + Clerk auth |

**类型分布**: Agent 4 · Hybrid 2 · Script 4 = 10 skill。Agent 比例 40% 与 MVP "AI 视频解释器" 定位匹配。

## 基础架构承诺

> 来源: `app/README.md`(项目概览)+ `docs/01-discover/intent-brief.md` §4 硬约束 + `docs/design/handoff-to-engineering.md`(实现约束)

本项目无 `SOUL.md`(web app · 非 Claude Skill agent),等价"Core Truths"如下:

1. **Cooper 第一性 · Alan 自己是用户** — 优先满足 Alan 自用,5-31 上线 7 天 deadline 是硬线
2. **双语 MVP 非协商** — UI + 内容摘要双版 · i18n 100% · 0 fallback · 任何缺翻译 = 阻塞上线
3. **key 仅服务端 · sweat 不在客户端** — 沿用 bazi-studio Edge Function 架构 · LLM key 月度 rate-limit
4. **不下载视频原片 · embed + 外链 + 保留来源** — 版权红线 · 全部 30 条 video.metadata 保留原作者/频道/平台
5. **Simprr 品牌 footer 全站可见** — `https://x.com/simprr` 长期承载 · 每页可见
6. **MVP 砍到见骨** — 8 项伪需求(K1-K8)全砍 · 30 视频 / 10 人物 / 5 主题 / 2 档解释 / 桌面优先
7. **质量门**: N1 ≥ 85% / N2 = 100% / N3 = 0 critical(本期 N2 N3 达 · N1 上线后真测)
8. **改 prompt 不改接口** — LLM 准确率不达标走 prompt 调优循环 · 不动 API schema

## Skill 架构分层决策

> 来源: `skills-spec.md` 10 skill 的 type + 价值漏斗(L0-L3)from `evaluation-framework.md` §2

| Skill | skill_type | funnel_layer | 为什么这么分 |
|---|---|---|---|
| S1 summary | Agent | L1 → L2 | 处理层(LLM 压缩)→ 输出层(双语显示) |
| S2 keypoints | Agent | L1 → L2 | 同上 + 反 hallucination 严守 L1 |
| S3 timeline | Hybrid | L1 → L2 | Script 分段属 L1 · Agent 命名跨 L1→L2 |
| S4 explainer | Agent | L1 → L2 | 同 S1 · 双档差异化是 L2 价值 |
| S5 person-aggregator | Agent | L1 → L2 | 跨视频 JOIN + LLM 提炼 · 异步 batch |
| S6 video-crud | Script | L0 | 输入层(运营录入)· 触发下游 pipeline |
| S7 semantic-search | Hybrid | L0 → L2 | embedding L0(查询编码)+ pgvector L0(检索)→ 视频卡片 L2 |
| S8 keyword-search | Script | L0 → L2 | trigram / tsvector 检索 · 0 LLM |
| S9 orchestrator | Script | L1 | 编排所有 L1 LLM skill · 状态机层 |
| S10 favorite-crud | Script | L0 | 输入层(用户收藏行为) |

**架构分层规律**: L1 LLM 集中(S1-S5)· L0 数据/搜索(S6-S8,S10)· S9 协调层。Hybrid 都跨层(S3 L1→L2, S7 L0→L2)。

## 质量目标 & 评估规模决策

> 来源: `confirmed_params.threshold` / `trials_per_case` / `cases_count_per_skill` + intent-brief §6.2

| 决策 | 值 | Rationale |
|---|---|---|
| 统一阈值 threshold | **85%** | intent-brief §6.2 "摘要准确率 ≥ 85%" 直接映射 · 不做多指标分别校准(MVP 简化) |
| trials_per_case | **3** | 平衡 variance 与 token 预算 · 3 次足以排查偶发 LLM 抖动 |
| cases_count_per_skill | **5** | Agent/Hybrid skill 各 5 case · 共 25 cases · 25 × 3 trials × $0.005 ≈ $0.4 评估成本 · 可控 |
| 评估模式 | **Desk Evaluation** | MVP 阶段子 agent 无 DeepSeek key · 28/30 视频 platform_id 占位 · 不真跑 · 上线后 Alan 用真 key 跑 |
| Stability 跑 3 轮 | regression × 3 · 0% variance | MVP 简化 · 不跑 soak/load |

## Phase D CEO 循环决策

> 来源: `docs/04-evolve/round-001/round-001.md` + `ledger.tsv`

| # | 候选 | CEO 决策 | 因果链(回对 primary goal) |
|---|---|---|---|
| C1 | W3 lazy init(`db/client.ts`) | **KEPT** | build 不再需要 stub `DATABASE_URL` → Vercel CI 友好度 ↑ → 5-31 deadline 安全垫 |
| C2 | W4 tsc 单独跑 TS6046 | **KEPT-as-doc** | Next 15 + `moduleResolution: bundler` 已知 upstream · 强改破坏 Next build 链 · 用 `next build` 内置 tsc 替代 + 文档化 |
| C3 | W6 `/api/search` rate-limit 30/60s | **KEPT** | 防 `mode=semantic` 被刷飙 OpenAI 账单 → 7 天 Alan 自用窗口安全 |
| C4 | 28 视频 platform_id 回填 | **PARTIAL + DEFERRED** | 3 真 ID(Lex 419 / Karpathy intro / Karpathy Lex 333)+ 27 `_DRAFT` 后缀强制可见占位 · 避免老吴瞎编一个真存在但内容不符的 ID(更坑) |
| C5 | 9 步 deployment-runbook + LLM eval plan + post-launch checklist | **KEPT** | Phase D 老吴本职就是把上线路径变成"傻瓜 9 步" |

**统计**: KEPT=3 · KEPT-as-doc=1 · PARTIAL+DEFERRED=1 · DISCARDED=0
**Anti-overfitting**: 5 项全 GENERAL · 0 point-fix · 本轮纯加固 · 不引入新功能。

## 显式 ADR 缺口

**未发现显式 ADR 缺口** — 上述 8 数据源已覆盖全部关键决策。

可能需要 Phase D round-002 后补的 ADR 候选(若真上线后触发):

- **ADR-D-001**: Clerk `auth()` 接管 favorites + admin/videos(替换 W5 stub `x-user-id`)— 时机未定 · Alan 决策
- **ADR-D-002**: LLM eval < 85% 时 prompt 调优策略选择(few-shot 加强 / temperature 调低 / response_format 严格化)
- **ADR-D-003**: 30 视频跑通后扩到 100/500/1000 视频的 ingest 调度策略(Vercel Cron / Inngest / 自建 queue)— 当前 MVP 是同步 CLI

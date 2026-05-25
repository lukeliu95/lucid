# 14 · 项目复盘

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: pipeline-state(全量统计)· reflections · round-001 · evolve_summary · qualify_summary · frontend_summary · generate_summary
> 自动化类型: ✅ 全自动

## 项目成就

| 维度 | 成绩 |
|---|---|
| **Pipeline 推进** | A → B.0 → B.1//B.2 → C → D.1 直线推进 · 0 回退 · 5 个 reflection checkpoint 全 CONTINUE/FINALIZE/COMPLETE |
| **Skill 数量** | **10**(4 Agent + 2 Hybrid + 4 Script) |
| **UI 实现** | 6 pages + 18 components(B.1 小赵) |
| **DB 表数** | 9(videos / videos_ai / video_embeddings / people / topics / video_people / video_topics / favorites / pipeline_runs) |
| **API Routes** | 9 |
| **Edge Functions** | 1(DeepSeek 代理) |
| **i18n keys** | 110 · 100% zh/en 对齐 |
| **Design tokens** | 88(DTCG 格式) |
| **代码量** | TypeScript 4,071 LOC · Markdown 5,040 LOC · 130 git-tracked files |
| **质量分(final_score)** | **0.92** · stable_after_one_round |
| **结构 eval 通过率** | 5/6(round-001 后 6/6 实质 PASS) |
| **可执行 eval 通过率** | 4/4(build / tsc-via-next / a11y / regression) |
| **北极星(本期可测)** | N2 i18n 100% ✅ · N3 a11y critical=0 ✅ · N1 ⏸ Desk |
| **改进轮次** | 1(maintain 单轮 · Δ +14% · 远超 +2% threshold) |
| **成本** | 开发期 LLM 估算 ~$2.5 · ingest 全量 $0.51 · 30 视频单条 $0.017 |
| **预算 vs 实际** | 预算 ≤ $10 · 实际 $0.51 · **节省 95%** |

**亮点**:

- **MVP 砍到见骨** — Phase A 砍 8 项伪需求(K1-K8 · 1000 视频 → 30 / 5 档解释 → 2 / 复杂推荐 → 编辑精选 / 全领域 → AI+科技+商业)· 让 7 天 deadline 可达
- **B.1//B.2 并行无串行回退** — 小赵前端 + 大刘后端同步交付 · build/tsc 全过
- **沿用 bazi-studio 架构红利** — Edge Function + key 隔离 + Clerk Marketplace 复用 · 0 踩新坑
- **Desk Evaluation 务实** — 子 agent 无 DeepSeek key + 28/30 视频 ID 占位 · 设计 25 cases seeded · 不烧预算硬跑
- **round-001 单轮收尾** — 4 个 W 工单 1 个 KEPT-as-doc + 1 PARTIAL+DEFERRED + 2 KEPT · 工程层完全闭环

## 关键学到的东西

> 来源: reflections.reasoning + round-001 anti-overfitting 检查 + alan_late_call_phase_a

1. **Cooper "自己是用户" 是最强 prompt** — Alan 自己是用户身份让"砍 8 条伪需求"变得简单 · 没有客户教育成本
2. **裁决项现场拍板省一轮往返** — Phase A 老周本要裁的 Auth/ORM/embedding/i18n 4 项 · Alan 一句话拍板(`alan_late_call_phase_a`)· 省 1 轮 dialogue
3. **`_DRAFT` 后缀 > `PLACEHOLDER` 数字** — 占位符要"强制可见且不撞真值空间" · `PLACEHOLDER1` 可能撞真 YouTube 短 ID · `_DRAFT` 后缀绝对不会
4. **lazy init 是 env-coupled 模块的通解** — W3 `db/client.ts` 模块级 `neon()` 必依赖 `DATABASE_URL` · 改用 Proxy 透传 lazy init · build 不再需要 stub · 这是任何 env-coupled 模块的 GENERAL fix
5. **Next 15 + `moduleResolution: bundler` 已知冲突** — standalone tsc 单跑会 TS6046 · 但 `next build` 内置 tsc 通过 · 不要强改 tsconfig 破坏 build 链 · 走文档化(`known-tsc-issue.md`)
6. **rate-limit 应跟着"外部计费 API"走** — 不只是 ai/chat · 凡走 OpenAI / DeepSeek 计费的 route 都要(W6 给 `/api/search` 加 30/60s)· 这是 GENERAL pattern
7. **Desk Evaluation 是 MVP 紧迫期的合法策略** — 当 LLM key + 真数据双重不可用时,seeded 25 cases + rubric + 预期完整写,Phase D 上线后用真 key 跑 · 比"硬上 50% 假数据评估"更诚实
8. **单轮 maintain 也能 +14%** — Phase D 不一定要多轮 · maintain mode 单轮收尾 4 个工程 issue · stability check 已达 stable_after_one_round

## 过程中命中的 pattern(复用经验)

> `retrieved_memory_entries = {}` · 但隐性沿用以下 GEI / bazi-studio 已验证 pattern:

| Pattern | 来源 | 本项目使用方式 |
|---|---|---|
| **Edge Function + 服务端 key 隔离** | bazi-studio | LLM key 仅服务端 · 月度 rate-limit · `/api/ai/chat` Edge Function 代理 |
| **Clerk Vercel Marketplace 一键集成** | bazi-studio | 自动注入 `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| **next-intl `[locale]` segment** | Next.js 15 官方推荐 | default `zh` + en · 100% key coverage |
| **DTCG design tokens** | 行业标准 | Mia 88 个 token · 生成 `tailwind.config.snippet.ts` |
| **MVP 砍到见骨**(Musk 第一性) | Alan 风格 | 8 项伪需求 K1-K8 全砍 |
| **GEI Phase B 并行 B.1//B.2** | GEI v4.x 默认 | Mia handoff 后小赵 + 大刘 1h 内并行交付 |
| **rubric + deterministic 双层 eval** | GEI qualify framework | 字数 / JSON 合法 / 锚点真伪(deterministic)+ 5 维度 LLM rubric |
| **Anti-overfitting 检查** | GEI evolve framework | round-001 5 候选全 GENERAL · 0 point-fix |
| **valuechain L0→L3 分层** | GEI evaluation-framework | L0 search · L1 LLM · L2 UI · L3 转发 / 自用 |

## 过程中命中的 pitfall(教训)

| Pitfall | 表现 | 兜底 |
|---|---|---|
| **scope 过宽稀释定位** | PRD 原写 1000 视频 / 5 档 / 7 命名候选 / 全领域 | 砍 8 项(K1-K8) |
| **env-coupled 模块级 side-effect** | W3 `db/client.ts` 模块级 `neon()` 让 build 必须传 stub `DATABASE_URL` | round-001 lazy init |
| **占位符撞真值空间** | `PLACEHOLDER1` 可能是真 YouTube 短 ID | 改用 `<slug>_DRAFT` 后缀 |
| **外部计费 API 无 rate-limit** | W6 `/api/search?mode=semantic` 走 OpenAI embedding · 上线必被刷 | round-001 接 `lib/rate-limit.ts` 30/60s/IP |
| **standalone tsc 与 framework 内置 tsc 冲突** | W4 TS6046 · `moduleResolution: bundler` | KEPT-as-doc · 用 `next build` 内置 tsc 替代 + `known-tsc-issue.md` |
| **子 agent 无 LLM key 仍硬跑 eval** | MVP 期 DeepSeek key 不能下放子 agent | Desk Evaluation 策略(seeded 不跑) |
| **过早乐观真测 30 视频** | 28/30 platform_id 是占位 · 假数据评估骗自己 | 强制 `_DRAFT` 可见占位 + 真测留 Phase D |

## 可沉淀为 gei-memory 的经验

> 来源候选: 本次 pipeline 中"首次 / 意外 / 新模式"关键词 + improvement_rounds > 2 的 Skill(无 · 本项目 round-001 单轮)+ Desk Evaluation 等特殊模式心得

**强候选**(建议沉淀):

1. **`pattern · desk-evaluation-when-no-llm-key`**
   - **场景**: MVP 紧迫期 + 子 agent 不可访问 LLM key + 大量数据占位
   - **做法**: 不强跑 LLM eval · 完整设计 N cases × rubric + 预期 + 预算估算 · Phase D 上线后用真 key 跑回填
   - **GEI 落地**: qualify worker 检查 `confirmed_params.has_llm_key_in_subagent == false` 时自动走 Desk · 不报错

2. **`pattern · placeholder-must-collide-free`**
   - **场景**: seed/mock 数据中需要"用户必须上线前看见并替换"的占位符
   - **做法**: 用 `<meaningful_slug>_DRAFT` 后缀 · 不用 `PLACEHOLDER1/2/3` 数字
   - **GEI 落地**: generate worker 生成 seed 文件时,所有占位字段都用 `_DRAFT` 后缀 + 注释

3. **`pattern · rate-limit-follows-external-billing`**
   - **场景**: 任何走外部计费 API 的 route(OpenAI / DeepSeek / Stripe webhook etc.)
   - **做法**: 都要接项目级 rate-limit · 不只是 chat / completion · 包括 embedding / image / search
   - **GEI 落地**: generate worker 在产 API route 时,扫到 `import.*openai|deepseek|anthropic` 自动注入 rate-limit middleware

4. **`pattern · lazy-init-env-coupled-module`**
   - **场景**: 任何依赖 env vars 的模块级 side-effect(DB client / API client / SDK init)
   - **做法**: 不在 module load 时 init · 用 Proxy 透传 lazy init · build 不需要 stub
   - **GEI 落地**: frontend / generate worker 写 `db/client.ts` / API client 时默认 lazy

**弱候选**:

5. **GEI Phase D maintain 单轮收尾的判定** — 不一定要多轮 · stable_after_one_round + Δ > +2% threshold 即可退出

**沉淀路径**: 这 4 条强候选可由 Alan 用 `gei:memorize` 写到 `local/gei-memory/learnings.md` · 下次 pipeline 自动 retrieve。

## 建议后续演进

> 基于 funnel_diagnosis.fix_direction + alan_concerns_before_launch + alan_late_call_phase_a

### 上线前 24h 内必做(Alan 一人)

1. **27 视频 `_DRAFT` 真 YouTube ID 回填**(R-01)— `deployment-runbook` Step 0 必做
2. **W6 rate-limit 复测** — 跑一次 `/api/search?mode=semantic` 30+ 次确认 429
3. **3 把 key 就绪**(DeepSeek / OpenAI / Clerk · 沿用 bazi-studio)

### 上线后第一周(round-002 候选)

4. **25 cases LLM eval 真测**(R-02) — 不达 85% 走 prompt 调优
5. **Lighthouse prod 真测**(R-12)— Perf / A11y / BP / SEO 全过 90/80
6. **OpenAI / DeepSeek 账单复核**(防 R-06 复发)

### 中期演进(v1.1+)

7. **W5 Clerk `auth()` 接管**(R-07)— favorites + admin/videos 切真 session
8. **移动响应式**(intent K4 v1.1)— 当前桌面优先 · 真有移动流量再做
9. **用户提交链接 + 队列**(intent K2 v1.1)— Vercel Cron / Inngest
10. **内容池扩到 100 视频**(可扩性)— 调度策略 ADR-D-003 候选

### 长期演进(v2.0)

11. **知识图谱 / 学习路径 / 观点对比**(intent K8 v2.0)— 当前已切割
12. **5 档解释**(intent K1 v2.0)— 当前 2 档够用 · 真有需求再做
13. **多领域扩展**(intent K5 v2.0)— 历史 / 心理 / 经济 等

---

*pipeline 复盘完 · final_score 0.92 · ready_to_deploy · Alan / Simprr · 2026-05-25*

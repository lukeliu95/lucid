# 03 · 开发计划文档

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: pipeline-state.phase_status · reflections · 04-evolve/round-001
> 自动化类型: ✅ 全自动

## 里程碑

| Phase | 目标 | 开始 | 结束 | 耗时 | 状态 |
|---|---|---|---|---|---|
| A · Discover | 25 章 PRD → 6 模块 21 REQ + 10 skill + 12 UI + 30 视频选片 + 类型分流 | 2026-05-24T00:00Z | 2026-05-24T01:00Z | ~1h | ✅ completed |
| B.0 · Design | 4 大页面 wireframes + 高保真 HTML + 88 design tokens + 110 i18n keys + 16 components + Stage E 自查 all-pass | 2026-05-24T01:00Z | 2026-05-24T02:00Z | ~1h | ✅ completed |
| B.1 · Frontend(小赵)| 6 pages + 18 components + i18n zh/en + build PASS + LCP est 1.8s / bundle 139KB | 2026-05-24T02:00Z | 2026-05-24T03:00Z | ~1h | ✅ completed |
| B.2 · Backend(大刘)| 10 skill + 9 API routes + 9 DB tables + Edge Function + tsc PASS + key 隔离 | 2026-05-24T02:00Z | 2026-05-24T03:00Z | ~1h(并行) | ✅ completed |
| C · Qualify(阿May)| 结构 eval 5/6 · build/tsc/i18n100/a11y critical=0 · 25 LLM cases seeded · stability PASS | 2026-05-24T03:00Z | 2026-05-24T04:00Z | ~1h | ✅ completed |
| D · Evolve(老吴 round-001)| W3 lazy init / W4 标注 / W6 rate-limit / 3 真 YT ID + 27 _DRAFT / 9 步 runbook + eval plan + checklist · final_score 0.92 | 2026-05-24T04:00Z | 2026-05-25T00:00Z | ~20h(含夜间)/ reflection 主动 ~1h | ✅ completed |

**reflection 主动工时合计**: ~6h(Phase A→D 5 个 checkpoint reflection 跨度)
**mtime 跨度**: 2026-05-24T00:00Z → 2026-05-25T00:00Z ≈ 24h(含夜间 / 离开时间 · 运维 SLA 用此值)

## 任务拆解

派活预案锁死在 intent-brief §7 + 实际执行映射:

```
Phase A   小灰  → 21 REQ 规格 + 10 skill + 12 UI + 30 视频清单 + 类型分流(Agent/Script/Hybrid)
Phase A   老周  → project_type = hybrid 锁定 + 技术栈深判(Clerk/Drizzle/OpenAI-emb/next-intl 由 Alan 最终拍板)
Phase B.0 Mia   → 4 大页面设计 + 88 design tokens + 110 i18n keys + 16 components + Stage E 双轨评审
Phase B.1 小赵  → Next.js 15 前端照稿实现 + next-intl + Tailwind + shadcn-style
Phase B.2 大刘  → 10 skill + Edge Function (DeepSeek 代理) + ASR 流水线 + pgvector + 9 表 schema
Phase C   阿May → 结构/构建/a11y/i18n eval + 25 cases LLM seeded + 稳定性 gate(regression × 3)
Phase D   老吴  → maintain round-001(W3/W4/W6 + 28 视频 ID + 9 步 runbook + eval plan + checklist)
```

并行机会(已实际执行):
- B.1 小赵 + B.2 大刘 并行(Mia handoff 落地后)— ~1h 内同步完成
- 30 视频选片与 B.1/B.2 工程并行(运营层)

## Reflection 检查点

| Checkpoint | 时间 | 决策 | 关键 reasoning |
|---|---|---|---|
| A | 2026-05-24T01:00Z | CONTINUE | 21 REQ / 10 skill / 12 UI / 30 视频清单完整 · scope_complete=true · 双语约束已贯穿 DB 拆 zh/en 双字段 · Alan 现场拍板替代老周裁决(Auth/ORM/embedding/i18n)· 进 B.0 |
| B.0 | 2026-05-24T02:00Z | CONTINUE | Mia 4 页 wireframes + 高保真 HTML + 88 tokens + 110 i18n + 16 components · Stage E all-pass(可行性/可用性/双语/版权)· visual=electronic-magazine × e-ink · 进 B.1/B.2 |
| B.1+B.2 | 2026-05-24T03:00Z | CONTINUE | 小赵 6 页 18 组件 build PASS · LCP 1.8s / bundle 139KB · 大刘 10 skill 9 API 9 表 tsc PASS · key 隔离 0 泄漏 · $0.017/视频 · 3 W 工单非阻塞 · 进 Phase C |
| C | 2026-05-24T04:00Z | FINALIZE | 工程层全过(build/tsc/a11y critical=0/i18n 100%/stability)· 25 LLM eval seeded 待 Phase D 真测 · 3 concerns 全是运营/上线前补救 · final_recommendation=ready_to_deploy · 询问是否进 Phase D |
| D.1 | 2026-05-25T00:00Z | COMPLETE | 老吴 round-001 maintain 单轮 · 5 候选 4 KEPT 1 DEFERRED · W3 lazy init + W4 标注 + W6 search rate-limit 30/60s · 28 视频(3 真 ID + 27 _DRAFT 强制可见)· 9 步 runbook + LLM eval plan + post-launch checklist · final_score 0.92 |

## 依赖与排程

Phase 依赖固定为 **A → B(B.0 → B.1//B.2) → C → D**:

```
A (discover)
    ↓
B.0 (Mia design)
    ↓ handoff-to-engineering.md
B.1 (小赵 frontend) // B.2 (大刘 backend) — 并行
    ↓
C (阿May qualify)
    ↓ ready_to_deploy
D (老吴 evolve · 可选)
    ↓ deployment-runbook
[Alan 手动上线 5-31]
```

跨 Phase 依赖契约:
- A → B.0: `requirements-spec.md` + `decomposition.md` + `content-plan.md`(必须 scope_complete=true)
- B.0 → B.1/B.2: `handoff-to-engineering.md` + `design-tokens.json` + `tailwind.config.snippet.ts` + `i18n-keys.md`
- B.1//B.2 → C: `app/` build PASS + tsc PASS + 9 API + 18 components
- C → D: `delivery-report.md` final_recommendation=ready_to_deploy + 25 LLM cases seeded
- D → 上线: `deployment-runbook.md` 9 步 + `post-launch-checklist.md` 24h/7 天清单

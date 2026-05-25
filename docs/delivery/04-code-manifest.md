# 04 · 代码清单

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: git ls-files · docs/02-generate/skills-spec.md · app/src/**
> 自动化类型: ✅ 全自动(hybrid project_type — skill 定义在 docs/02-generate/skills-spec.md · 实现在 app/src/lib + app/src/app/api)

## Skill 目录(10 个 backend skill)

| Skill | 类型 | 触发 / 入口 | 实现路径 | 对应 REQ |
|---|---|---|---|---|
| **S1 summary-generator** | Agent | pipeline 内调用 | `app/src/lib/ai/prompts/s1-summary.ts` + `app/src/lib/ai/deepseek.ts` | REQ-V02 |
| **S2 keypoints-extractor** | Agent | pipeline 内调用 | `app/src/lib/ai/prompts/s2-keypoints.ts` | REQ-V03 |
| **S3 timeline-builder** | Hybrid | pipeline 内调用(Script 分段 + Agent 命名) | `app/src/lib/ai/prompts/s3-timeline.ts` + `app/src/lib/ai/pipeline.ts` | REQ-V04 |
| **S4 two-tier-explainer** | Agent | pipeline 内调用 | `app/src/lib/ai/prompts/s4-explainer.ts` | REQ-V05 |
| **S5 person-profile-aggregator** | Agent | 异步 · `ai_done` 后 | `app/src/lib/ai/prompts/s5-person.ts` + `app/src/scripts/aggregate-person.ts` | REQ-P02 |
| **S6 video-crud** | Script | `POST/GET /api/admin/videos` | `app/src/app/api/admin/videos/route.ts` | REQ-X01 |
| **S7 semantic-search** | Hybrid | `GET /api/search?mode=semantic` | `app/src/lib/search/semantic.ts` + `app/src/app/api/search/route.ts` | REQ-S02 |
| **S8 keyword-search** | Script | `GET /api/search?mode=keyword` | `app/src/lib/search/keyword.ts` | REQ-S01 |
| **S9 ai-pipeline-orchestrator** | Script | CLI `npx tsx src/scripts/ingest-video.ts --video-id N` | `app/src/lib/ai/pipeline.ts` + `app/src/scripts/ingest-video.ts` | 编排 S1-S4 + S8 |
| **S10 favorite-crud** | Script | `POST/DELETE/GET /api/favorites` | `app/src/app/api/favorites/route.ts` | REQ-U02/U03 |

> SKILL.md frontmatter / triggers / allowed-tools 适配说明: 本项目为 web app 类型(非标准 customer-agent),skill 没有独立 `skills/{name}/SKILL.md` 文件,定义集中在 `docs/02-generate/skills-spec.md` 内 S1-S10 节,触发方式为 API route / pipeline 内函数调用 / CLI script,无 Claude Skill triggers。

## 知识库

| # | 名称 | 来源 | 存储 | 备注 |
|---|---|---|---|---|
| K-01 | 30 demo 视频元数据 | 运营选片 + YouTube/B 站公开 | DB(`videos` 表)+ `app/src/db/seed.ts` | 3 真 YT ID + 27 `_DRAFT` 强制可见占位 · 上线前 Alan 必须回填 |
| K-02 | 字幕原文 | YouTube 公开字幕 / 本地 Whisper | text + timestamps | 不入 Git · 运营机器本地处理 |
| K-03 | 5 主题定义 | Alan 编辑 | DB(`topics` 表) | AI / AI Agent / 创业 / 芯片 / 未来工作 |
| K-04 | 10 人物档案 | 运营整理 | DB(`people` 表) | 含双语简介 + signature_views_zh/en |
| K-05 | i18n 中英 keys(110 条) | Mia design tokens | `app/messages/zh.json` + `app/messages/en.json` | 100% 对齐 · eval PASS |
| K-06 | DTCG Design Tokens(88 个) | Mia | `docs/design/tokens/design-tokens.json` | 颜色 / 字号 / 间距 / 字体栈 |

> 本项目无 `memory/knowledge/` 目录(web app 类型 · 不是 Claude Skill agent · 知识库走 DB + 静态 JSON)。

## 核心配置文件

> 本项目无 `SOUL.md` / `CLAUDE.md`(web app 类型 · 不是 Claude Skill agent)。等价说明从以下文件提取:

- **`app/README.md`** — _kdsj-world · 看懂世界 · AI 视频知识解释平台 · Next.js 15 App Router · next-intl · Tailwind · shadcn-style components。_
- **`docs/design/handoff-to-engineering.md`** — _Mia → 小赵(B.1 前端)+ 大刘(B.2 后端 · API contract 对齐)· 2026-05-24 · Stage F · Stage E 自查全 PASS · 含实现约束 / 资产路径 / 性能预算。_
- **`docs/04-evolve/deployment-runbook.md`** — _kdsj-world · 上线部署单(9 步)· 给 Alan 一个人,本地执行 · 预算 30 视频 ingest 约 $0.51 + Vercel/Neon 免费层 · 预期总耗时 2-4 小时。_

## Git 跟踪文件完整清单

> ✅ 本项目内部已 git init · `git ls-files` 直接可用。

**统计**:

| 类型 | 文件数 |
|---|---|
| 总文件数(`git ls-files`) | **130** |
| `app/**`(应用代码) | 79 |
| `docs/**`(交付文档) | 50 |
| `pipeline-state.json`(GEI 状态) | 1 |

**按扩展名(全仓库)**:

| 扩展名 | 数量 |
|---|---|
| `.md` | 43 |
| `.ts` | 36 |
| `.tsx` | 32 |
| `.json` | 7 |
| `.html` | 4(高保真设计稿) |
| `.css` | 3 |
| `.tsv` | 1(ledger) |
| `.mjs` | 1 |
| `.example` / `.gitignore` / `.tsbuildinfo` | 各 1 |

**应用代码关键路径**(`app/src/` · 66 文件):

```
app/src/app/[locale]/
    layout.tsx · page.tsx · not-found.tsx
    videos/[slug]/page.tsx
    people/[slug]/page.tsx
    topics/[slug]/page.tsx
    search/page.tsx
    favorites/page.tsx
app/src/app/api/
    health/route.ts
    videos/route.ts · videos/[slug]/route.ts
    people/[slug]/route.ts
    topics/[slug]/route.ts
    search/route.ts
    favorites/route.ts
    admin/videos/route.ts
    ai/chat/route.ts(Edge Function · DeepSeek 代理)
app/src/components/
    layout/{footer,header,lang-switcher,skip-link}.tsx
    video/{player,summary-block,keypoints-list,timeline-nav,two-tier-tabs,favorite-button}.tsx
    person/{person-card,person-hero}.tsx
    search/search-bar.tsx
    shared/{ai-pending-banner,mark}.tsx
    ui/{badge,button,card,input,separator,tabs}.tsx
app/src/lib/
    ai/{deepseek.ts, pipeline.ts, prompts/s1..s5}
    search/{keyword.ts, semantic.ts}
    rate-limit.ts · api.ts · mock-data.ts · i18n.ts
app/src/db/
    schema.ts · client.ts(W3 lazy init)· seed.ts
app/src/scripts/
    ingest-video.ts · aggregate-person.ts
```

## 代码统计

| 维度 | 值 |
|---|---|
| TypeScript(.ts + .tsx)LOC | **4,071** |
| Markdown 文档 LOC | 5,040 |
| 总文件数 | 130 |
| 应用代码文件(`app/`) | 79 |
| 文档文件(`docs/`) | 50 |
| Pages 实现 | 6(home / video / people / topics / search / favorites + locale layout) |
| Components 实现 | 18(layout 4 / video 6 / person 2 / search 1 / shared 2 / ui 6) |
| API Routes | 9 |
| DB Tables | 9 |
| Edge Functions | 1(DeepSeek 代理 `api/ai/chat`) |
| i18n locales | 2(zh default + en) |
| i18n keys | 110(100% 对齐) |
| Design tokens | 88 |

# 02 · 需求分析文档

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: docs/01-discover/requirements-spec.md · decomposition.md
> 自动化类型: ✅ 全自动(hybrid project_type — 见 §需求分解表)

## 功能性需求

按 6 模块 21 REQ 组织(详见 `docs/01-discover/requirements-spec.md` §4)。

### 模块 H · 首页(Home)

- **REQ-H01** · 精选 30 视频展示(P0)· grid + 时间倒序 + footer Simprr
- **REQ-H02** · 双语切换 toggle(P0)· next-intl 路由 · i18n 100% coverage
- **REQ-H03** · 主题导航 + 热门人物(P1)

### 模块 V · 视频详情页(核心)

- **REQ-V01** · 视频嵌入播放器(YouTube/B 站 iframe)
- **REQ-V02** · 一句话总结(≤ 80 字双语)· Agent
- **REQ-V03** · 核心观点 5-10 条 · 反 hallucination · Agent
- **REQ-V04** · 时间轴 ≥ 5 节点 · Hybrid(Script 分段 + Agent 命名)
- **REQ-V05** · 2 档解释(成人速懂 300 字 / 深度版 800-1500 字)· Agent
- **REQ-V06** · 视频内双语切换 · 0 fallback
- **REQ-V07** · 来源信息 + 版权链

### 模块 P · 人物页

- **REQ-P01** · 人物详情(10 位 · 头像 + 简介 + 代表观点 + 相关视频)
- **REQ-P02** · 人物代表观点生成(基于该人物所有视频聚合)· Agent

### 模块 T · 主题页

- **REQ-T01** · 主题聚合(5 个 · AI / AI Agent / 创业 / 芯片 / 未来工作)

### 模块 S · 搜索

- **REQ-S01** · 关键词搜索(标题 / 人物 / 主题)· Script · ≤ 500ms
- **REQ-S02** · 简易语义搜索 · Hybrid · pgvector top-k

### 模块 U · 用户与收藏

- **REQ-U01** · 登录(Clerk · 邮件/Google OAuth)
- **REQ-U02** · 收藏视频(幂等)
- **REQ-U03** · 个人主页 `/me`

### 模块 X · 极简后台

- **REQ-X01** · 视频 CRUD(运营加视频自动触发 AI 流水线)
- **REQ-X02** · AI 处理状态查看(pending / asr_done / ai_done / failed)
- **REQ-X03** · 摘要校对(轻量编辑)

## 非功能性需求

| 项 | 要求 |
|---|---|
| 响应速度 | 首页 / 详情页 LCP ≤ 2.5s |
| Lighthouse | Perf ≥ 80 / A11y ≥ 90 / Best Practices ≥ 90 / SEO ≥ 90 |
| 双语 | 100% i18n key coverage |
| 并发 | MVP < 100 DAU |
| 部署 | Vercel prod · 域名 `kdsj-world.vercel.app` 或自有域名 |
| 数据安全 | LLM key 仅服务端 · Edge Function + 月度 rate-limit · 沿用 bazi-studio 架构 |
| 版权 | 不下载视频 · embed/外链 + 保留原作者/平台 |
| 浏览器 | Chrome / Safari / Edge 最近 2 版本 · IE 不支持 |
| 性能预算(前端) | 首屏 JS < 200KB · CLS < 0.05 · 实测 LCP est 1.8s / bundle 139KB ✅ |

## 需求分解与类型分类

> hybrid project_type · 两栏合并(UI + Backend Skills)

### 后端 Skill(10 个 · Backend)

| 需求 ID | 描述 | 类型 | 对应 Skill | 优先级 |
|---|---|---|---|---|
| REQ-V02 | 一句话总结 | Agent | S1 summary-generator | P0 |
| REQ-V03 | 核心观点 5-10 条 | Agent | S2 keypoints-extractor | P0 |
| REQ-V04 | 时间轴 ≥5 节点 | Hybrid | S3 timeline-builder | P0 |
| REQ-V05 | 2 档解释 | Agent | S4 two-tier-explainer | P0 |
| REQ-P02 | 人物代表观点 | Agent | S5 person-profile-aggregator | P1 |
| REQ-X01 | 视频 CRUD | Script | S6 video-crud | P0 |
| REQ-S02 | 语义搜索 | Hybrid | S7 semantic-search | P1 |
| REQ-S01 | 关键词搜索 | Script | S8 keyword-search | P0 |
| (编排) | 流水线编排 | Script | S9 ai-pipeline-orchestrator | P0 |
| REQ-U02/U03 | 收藏 CRUD | Script | S10 favorite-crud | P0 |

### UI 模块(12 个 · Frontend · 18 components 实现)

| 需求 ID | 描述 | 类型 | 对应组件 | 优先级 |
|---|---|---|---|---|
| REQ-H01 | 视频卡片 grid | UI | `video-card` + page `[locale]/page.tsx` | P0 |
| REQ-H02 | 双语切换 | UI | `lang-switcher` | P0 |
| REQ-H03 | 主题/人物导航 | UI | `header` + `person-card` | P1 |
| REQ-V01 | 嵌入播放器 | UI | `player` | P0 |
| REQ-V02/03/05 | 摘要 / 观点 / 双档 | UI | `summary-block` / `keypoints-list` / `two-tier-tabs` | P0 |
| REQ-V04 | 时间轴 nav | UI | `timeline-nav` | P0 |
| REQ-V07 | 来源版权卡 | UI | 在 `video-detail` page | P0 |
| REQ-P01 | 人物详情页 | UI | `person-hero` + `person-card` | P0 |
| REQ-T01 | 主题页 | UI | `[locale]/topics/[slug]/page.tsx` | P0 |
| REQ-S01/S02 | 搜索栏 + 结果 | UI | `search-bar` + `mark` + `[locale]/search/page.tsx` | P0/P1 |
| REQ-U02 | 收藏按钮 | UI | `favorite-button` | P0 |
| REQ-U03 | 个人主页 | UI | `[locale]/favorites/page.tsx` | P0 |

**汇总**: 10 backend skills + 12 UI 模块 = 22 implementation units 覆盖 21 REQ(REQ-X02/X03 暂走运营人工 + S6 CRUD,Phase D 上线后再补管理 UI)。

## 验收标准

详见 `docs/01-discover/intent-brief.md` §6 + `docs/03-qualify/delivery-report.md` §3。本期工程层全过、LLM 输出层留 Phase D 真测。关键门:

- 功能验收(9 条 §6.1) — 8 ✅ + 1 ⏸(Vercel prod 部署待 Alan 执行 deployment-runbook)
- 质量验收(6 条 §6.2) — 工程层 3 ✅(i18n 100% / a11y critical=0 / 估算 LCP 1.8s) + 3 ⏸(LLM 摘要 ≥85% / 幻觉 ≤5% / 时间轴 ≥80% 待 25 cases 真跑)
- 上线 Day-1 北极星 — 待 5-31 后真测

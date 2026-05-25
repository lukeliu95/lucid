# 01 · 用户需求文档

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: docs/01-discover/intent-brief.md · pipeline-state.confirmed_params
> 自动化类型: ✅ 全自动

## 客户概览

- **客户名**: Simprr(Alan 自用 · 路径 A · `https://x.com/simprr`)
- **主语言**: 中文(zh-CN)
- **次语言**: 英文(en)
- **期望调性**: 杂志风 / 衬线 / 暖白底墨黑字 · 「电子杂志 × 电子墨水」视觉方向(Mia design-spec)

## 原始材料清单

[v4.7 web-app 项目 · intake 通过 Alan dialogue 5 回合产出 intent-brief 替代标准 `intake/manifest.md`]

| 文件 | 用途 |
|---|---|
| `docs/01-discover/intent-brief.md` | Alan-用户 5 轮对话产物(Primary Goal / Secondary Goals / 砍掉的伪需求 K1-K8 / 硬约束 / P0 答案 / 验收草稿) |
| `docs/01-discover/discovery-interview.md` | Phase A 老周 + Alan 技术栈裁决会谈纪要 |
| `docs/01-discover/requirements-spec.md` | 21 REQ 完整需求规格 |
| `docs/01-discover/content-plan.md` | 30 视频 / 10 人物 / 5 主题 demo 选片清单 |
| `docs/01-discover/ui-brief.md` | UI / IA 简报(给 Mia) |
| `docs/01-discover/decomposition.md` | 21 REQ → 10 skill / 12 UI 模块 分解表 |

## 会谈纪要摘录

**Primary Goal**(intent-brief §1):

> 用 AI 把"长得没人看完"的高密度视频(访谈/播客/演讲/纪录片),变成"两分钟就懂大概"的结构化知识卡。

**MVP 切口**(intent-brief §1):

> AI / 科技 / 商业人物访谈(英文原片为主 → 中英双语摘要),30 条 demo 视频在站,每条都能"两分钟看懂"。

**5 个 P0 答案**(intent-brief §5):

| # | 问题 | 答案 |
|---|---|---|
| P0-1 | 种子用户从哪来? | Alan 自己 + 朋友圈 + Twitter(@simprr) |
| P0-2 | 字幕来源? | YouTube 公开字幕优先 + 本地 Whisper ASR 兜底 |
| P0-3 | LLM 预算 + 选型? | DeepSeek-v4-pro 唯一 · 30 视频规模 < $10 |
| P0-4 | Alan 自己是用户吗? | 是 · 优先满足自己需求(Cooper 第一性) |
| P0-5 | 双语范围? | MVP 必须 UI + 内容摘要双版 |

**Alan 现场拍板的技术裁决**(pipeline-state.alan_late_call_phase_a):

- Auth: **Clerk**(Vercel Marketplace · 沿用 bazi-studio 未踩成熟方案)
- ORM: **Drizzle**(Edge Function 友好)
- Embedding: **OpenAI text-embedding-3-small**($0.02/1M · DeepSeek 暂无原生 embedding)
- i18n: **next-intl**(Next.js 15 App Router 标配)

## 核心目标

| Goal | 描述 | 验证方式 |
|---|---|---|
| G1 | Alan 自用(Cooper 第一用户) | 上线后一周 Alan 自己打开 ≥ 5 次 |
| G2 | 一条视频 → 两分钟读懂(摘要 + 5-10 观点 + 时间轴 + 2 档解释) | LLM eval 25 cases · 准确率 ≥ 85% |
| G3 | 中英双语 MVP(UI + 内容摘要双版) | i18n 100% key coverage |
| G4 | 2026-05-31 上线 + 30 demo 视频 + Twitter 传播 | Vercel prod 域名可访问 · 朋友圈 Day-1 ≥ 10 真实点击 |
| G5 | 长期承载 Simprr 品牌 | footer 全站可见 `https://x.com/simprr` |

## 约束与假设

### 硬约束

| 约束 | 值 |
|---|---|
| 上线截止 | 2026-05-31(7 天 · Vercel prod 可访问) |
| 双语 | MVP 必须双语(UI + 内容摘要双版) |
| LLM | DeepSeek-v4-pro 唯一 · Edge Function 代理 · key 仅服务端 |
| ASR | 本地 Whisper(运营机器跑 · 不进 LLM 预算) |
| 技术栈 | Next.js 15 App Router + shadcn + Vercel + Neon Postgres + pgvector |
| 署名 | Simprr · footer 含 `https://x.com/simprr`(全站每页可见) |
| 版权红线 | 不下载搬运原视频 · embed/外链 + 保留原作者/频道/平台/链接 |
| 预算 | 30 视频 × 双语 × 全栈处理 ≤ $10(实测 $0.51) |
| 桌面优先 | < 768px 提示"建议桌面访问"(移动响应式 v1.1+) |

### 砍掉的伪需求(K1-K8)

| # | 原 PRD 要求 | MVP 决定 | 理由 |
|---|---|---|---|
| K1 | 5 档分层解释 | **2 档**(成人速懂 + 深度版) | 5 档验证不了核心假设 · LLM 调用 ×5 不划算 |
| K2 | 用户提交链接 + 异步队列 | **MVP 砍** · v1.1+ | 先验证内容好不好看 · 运营人工预录入 30 条 |
| K3 | 复杂推荐系统 | **编辑精选 + 时间排序** | 1k DAU 前没数据可推 |
| K4 | 7 个产品名候选 + 移动响应式 | 工作名锁 `kdsj-world` · 桌面优先 | 命名属营销层 / 移动响应式 v1.1+ |
| K5 | 全领域内容 | **MVP 只做 AI/科技/商业** | 边界过宽稀释定位 |
| K6 | 1000 视频 / 100 人物 / 20 主题 | **30 / 10 / 5** | 7 天上线 + 双语 + 1000 视频 = 物理不可能 |
| K7 | 完整后台 8 模块 | **MVP 极简后台**(视频 CRUD + AI 状态) | 推荐位 / 数据看板都是 v1.1+ |
| K8 | 知识图谱 / 学习路径 | **v2.0** | MVP 不碰 |

### 假设

- 30 视频中 ≥ 70% 有 YouTube 公开字幕(否则 Whisper 工作量上升)
- Alan 每天能匀 1-2 小时跑选片 + 校对
- DeepSeek-v4-pro 在双语摘要任务上准确率 ≥ 85%(若不达需做 prompt 优化)

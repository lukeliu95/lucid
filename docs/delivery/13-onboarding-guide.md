# 13 · Onboarding 手册

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: app/README.md · handoff-to-engineering.md · deployment-runbook.md · intent-brief.md · skills-spec.md
> 自动化类型: ✅ 全自动(hybrid project_type · 适配 web-app · 无 SOUL.md/CLAUDE.md)

## 产品定位

**kdsj-world(看懂世界)** — AI 视频知识解释平台,把"长得没人看完"的高密度视频(访谈/播客/演讲/纪录片)变成"两分钟就懂大概"的结构化知识卡。

> MVP 切口:AI / 科技 / 商业人物访谈(英文原片为主 → 中英双语摘要)。

**不是**视频聚合站,**是**"长内容的解释器 + 入口"。

**5 条不可变信条**(等价 SOUL Core Truths):

1. **Cooper 第一性** · Alan 自己是用户 · 5-31 上线 7 天 deadline 是硬线
2. **双语 MVP 非协商** · UI + 内容摘要双版 · i18n 100% · 0 fallback
3. **Key 仅服务端** · 沿用 bazi-studio Edge Function 架构 · LLM key 月度 rate-limit
4. **不下载视频** · embed + 外链 + 保留原作者/频道/平台
5. **Simprr 品牌 footer 全站可见** · `https://x.com/simprr` 长期承载

## 产品人格与调性

| 维度 | 设定 |
|---|---|
| 视觉方向 | **电子杂志 × 电子墨水**(衬线 + 流体背景 + 暖色)· 暖白 `#F8F5EE` + 墨黑 `#1A1612` + 暖橘 `#D97706` accent |
| 字体 | Source Serif Pro(英文衬线)+ Source Han Serif SC(中文衬线)+ Inter(UI 字)· next/font 自托管 |
| 调性 | 严肃但不沉闷 · 像读 Aeon / Stratechery · 不像今日头条 |
| 内容信号 | 摘要严守不虚构 · 时间轴有锚点 · 双档解释字数严控 · 来源始终可点 |
| 写作风格 | 中文重短句 / 不堆 buzzword · 英文重 active voice / 不 padding |
| 反对 | 标题党 · 信息密度低的"开头废话" · 算法推荐遮蔽编辑判断 |

## 能力清单

**对内(产品已实现)**:

| 能力 | 实现 | 状态 |
|---|---|---|
| 视频精选首页(30 条) | `app/src/app/[locale]/page.tsx` | ✅ |
| 视频详情(嵌入 + 摘要 + 5-10 观点 + 时间轴 + 2 档解释 + 来源) | `[locale]/videos/[slug]/page.tsx` + 6 components | ✅ 组件齐 · LLM 内容待 ingest |
| 人物页(10 位 · 头像 + 简介 + 代表观点 + 相关视频) | `[locale]/people/[slug]/page.tsx` + S5 | ✅ |
| 主题页(5 个) | `[locale]/topics/[slug]/page.tsx` | ✅ |
| 搜索(keyword + semantic 两 mode + W6 rate-limit) | S7 + S8 + `api/search/route.ts` | ✅ |
| 收藏 + 个人主页(Clerk 登录) | S10 + `favorites/page.tsx` | ✅(W5 stub auth 待接 `auth()`) |
| 双语切换(zh / en 100% 对齐) | next-intl + 111 i18n keys | ✅ |
| AI 流水线(ASR + DeepSeek 4 skill + embedding) | S9 编排 + S1-S4 + S8 | ✅ 代码 · 待真跑 |
| 极简后台(视频 CRUD + AI 状态) | S6 + `admin/videos/route.ts` | ✅ |

**对外(Skill 触发协议)**:

详见 `08-interface-contracts.md`。本项目 skill 走 API route / pipeline 内调用 / CLI script,**不通过 Claude SKILL.md frontmatter triggers**。

## 如何触发各 Skill

| Skill | 触发方式 | 命令 / 接口 |
|---|---|---|
| S1-S4 LLM skills | 通过 S9 编排自动跑 | `npx tsx src/scripts/ingest-video.ts --video-id N` |
| S5 person-aggregator | 异步 · 新视频 `ai_done` 后自动 | `npx tsx src/scripts/aggregate-person.ts --person-id N`(手动重算) |
| S6 video-crud | Clerk admin 登录 + `POST /api/admin/videos` | `curl -X POST .../api/admin/videos -d '{...}'` |
| S7 semantic-search | 公开 GET | `curl '.../api/search?q=AGI&mode=semantic'` |
| S8 keyword-search | 公开 GET | `curl '.../api/search?q=AGI&mode=keyword'` |
| S9 orchestrator(独立 CLI) | 运营手动触发 | `npx tsx src/scripts/ingest-video.ts --video-id N` |
| S10 favorite-crud | Clerk 登录 + `/api/favorites` | UI 收藏按钮 / API |

## 继续进化(Phase D CEO 循环使用说明)

本项目已跑完 1 轮 maintain · final_score 0.92 · `exit_reason = max_rounds_reached_per_brief`。何时开 **round-002**:

- 上线后 LLM eval 真测 N1 < 85% → 改 prompt 走改进循环
- 用户反馈 / 朋友圈 Day-1 < 10 真实点击 → 内容侧加片 / 文案调优
- 新需求(如 W5 接 Clerk `auth()` / 移动响应式 / 内容池扩到 100 视频)→ Alan 决策

**触发方式**(对 Claude Code · GEI orchestrator):

```
"产品进化 · 跑 round-002 · 重点:LLM 准确率改 prompt"
"加功能:Clerk auth() 替换 W5 stub"
"修 bug:首页 LCP 退化到 3.2s"
```

orchestrator 会派 **老吴**(evolve worker)接单,候选生成 + CEO 决策 + KEPT/DISCARDED 评分 + 因果链回对 primary goal。

## 如何修改产品定位(等价 SOUL.md / CLAUDE.md 编辑)

本项目无 SOUL.md / CLAUDE.md 实体文件。等价编辑路径:

| 想改什么 | 改哪里 |
|---|---|
| 产品定位 / 不可变信条 | `docs/01-discover/intent-brief.md` §1-§4 |
| 砍掉 / 加入功能 | `docs/01-discover/requirements-spec.md` §4 REQ + §2.2 范围 |
| 视觉调性 | `docs/design/design-spec.md` + `docs/design/tokens/design-tokens.json` |
| 评估北极星 | `docs/03-qualify/evaluation-framework.md` §3 |
| 上线 SOP | `docs/04-evolve/deployment-runbook.md` |
| Runtime config(env / domain) | Vercel Project Settings → Environment Variables |
| 后台路径 / 运行命令 | `app/README.md` + `app/package.json` scripts |

**改完后**:必须跑一次 `生成交付报告` 重新打包 `docs/delivery/` · 让交付包反映最新状态。

## 常见操作手册

**1. 加一条视频**(运营 · MVP)

```bash
# Method A · 走 admin API
curl -X POST https://kdsj.world/api/admin/videos \
  -H "Authorization: ..." \
  -d '{"platform":"youtube","platform_id":"<YT_ID>","title_zh":"...","title_en":"...","topics":["ai"],"people":["sam-altman"]}'

# Method B · 直接 SQL + ingest CLI
psql $DATABASE_URL -c "INSERT INTO videos ... RETURNING id;"
npx tsx src/scripts/ingest-video.ts --video-id <RETURNED_ID>
```

**2. LLM 摘要不达标 → 改 prompt**

```bash
# 改 app/src/lib/ai/prompts/s1-summary.ts(只改 prompt · 不改接口)
# 重跑 eval suite 验证
DEEPSEEK_API_KEY=$KEY npx tsx src/llm-eval-suite/run-all.ts
# ≥ 85% PASS → 部署
vercel --prod
```

**3. 加新主题 / 新人物**

```sql
INSERT INTO topics (slug, name_zh, name_en, description_zh, description_en) VALUES (...);
INSERT INTO people (slug, name_zh, name_en, bio_zh, bio_en) VALUES (...);
```

**4. 切 Clerk auth()(接管 W5)** — Phase D round-002 候选

```ts
// app/src/app/api/favorites/route.ts
- const userId = req.headers.get('x-user-id');  // W5 stub
+ const { userId } = auth();                     // Clerk 真 session
```

**5. 监控 / 告警**

- Vercel Dashboard → Analytics → Web Vitals
- Vercel Dashboard → Logs(grep `5xx` / `429`)
- OpenAI / DeepSeek 控制台 → 每日 spend
- Clerk Dashboard → Sessions / Errors

**6. 回滚**

```bash
# Vercel CLI
vercel rollback <previous-deployment-url>
# 或 Dashboard → Deployments → Promote 上一个 stable
```

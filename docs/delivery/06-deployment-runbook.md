# 06 · 部署运维手册

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: docs/04-evolve/deployment-runbook.md(老吴 9 步)+ post-launch-checklist.md + app/README.md
> 自动化类型: ✅ 全自动

## 环境依赖

| 项 | 值 |
|---|---|
| Node.js | ≥ 20.x(Next.js 15 / React 19 要求) |
| Package manager | npm(`package-lock.json` 入 git) |
| Framework | Next.js 15 App Router + React 19 |
| UI | shadcn-style + Tailwind CSS 3 + DTCG tokens |
| i18n | next-intl(`[locale]` segment · default `zh`) |
| Auth | Clerk(Vercel Marketplace · 自动注入 env) |
| ORM | Drizzle ORM + drizzle-kit |
| DB | Neon Postgres + pgvector(`CREATE EXTENSION vector`) |
| LLM | DeepSeek-v4-pro(Edge Function 代理 · key 服务端 only) |
| Embedding | OpenAI text-embedding-3-small(1536d · $0.02/1M token) |
| ASR | 本地 Whisper(运营机器 · 不进 Vercel) |
| Deploy | Vercel(Hobby 或 Pro · prod 域名 `kdsj-world.vercel.app` 或自有) |
| 浏览器 | Chrome / Safari / Edge 最近 2 版本(IE 不支持) |

**必要 env vars**:

| Key | 值来源 | 备注 |
|---|---|---|
| `DATABASE_URL` | Neon Marketplace 自动注入 | 不用手填 |
| `DEEPSEEK_API_KEY` | DeepSeek 控制台 | 服务端 only |
| `OPENAI_API_KEY` | OpenAI 控制台 | 仅 embedding 用 |
| `CLERK_SECRET_KEY` | Clerk Marketplace 自动注入 | 服务端 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Marketplace 自动注入 | 客户端可见 |
| `NEXTAUTH_URL` | `https://kdsj.world` 或 vercel preview URL | Clerk redirect 用 |

**严禁**: 把任何 key 写进代码 / `.env.example` / commit message。

## 安装步骤

```bash
# 1. 克隆 + 安装依赖
git clone <repo>
cd kdsj-world/app
npm install

# 2. 拉环境变量(已 vercel link 后)
vercel env pull .env.local

# 3. 本地复核 build
npm run build       # 应 PASS · 10 静态页 + 9 API + 1 middleware
npm run typecheck   # via Next · 应 PASS
```

## 首次运行

详见 `docs/04-evolve/deployment-runbook.md` 完整 9 步(老吴 round-001 输出 · 给 Alan 一人本地执行)。摘要:

```
Step 0  前置确认       — build PASS / git clean / 27 _DRAFT 已替换 / 3 把 key 就绪
Step 1  Vercel link    — vercel link · 选 Simprr team · 项目名 kdsj-world
Step 2  Neon + pgvector — Marketplace 装 Neon + 跑 CREATE EXTENSION vector
Step 3  Env vars 配置  — 6 个 key(production + preview 都要)
Step 4  DB schema push — npx drizzle-kit push
Step 5  Seed 数据      — npx tsx src/db/seed.ts(5 topics + 10 people + 30 video stubs)
Step 6  Ingest 30 视频 — 单条 ~$0.017 · 30 条 ~$0.51 · 60-120 分钟
Step 7  Vercel 部署    — vercel(preview)→ smoke test → vercel --prod
Step 8  LLM eval 真测  — DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/llm-eval-suite/run-all.ts
Step 9  分发           — Twitter @simprr + 朋友圈 + (可选) Hacker News Show HN
```

预期总耗时: **2-4 小时**(主要是 28 视频真 YouTube ID 回填 + ASR/LLM ingest 跑批)。

## 日常运维

```bash
# 本地开发
cd app
npm run dev          # http://localhost:3000 → 重定向到 /zh

# 加单条视频(运营 · Phase D 上线后)
DEEPSEEK_API_KEY=$KEY OPENAI_API_KEY=$KEY \
  npx tsx src/scripts/ingest-video.ts --video-id <id>

# DB schema 改动
npx drizzle-kit generate   # 生成 migration
npx drizzle-kit push       # 应用到 Neon

# 重新部署
vercel              # preview
vercel --prod       # 直接 prod
```

**Routes 全清单**(应用层):

- `/[locale]` · 首页(30 视频精选)
- `/[locale]/videos/[slug]` · 视频详情(嵌入 + 摘要 + 5-10 观点 + 时间轴 + 2 档解释)
- `/[locale]/people/[slug]` · 人物页(10 位)
- `/[locale]/topics/[slug]` · 主题页(5 个)
- `/[locale]/search?q=...` · 搜索(keyword + semantic 两 mode)
- `/[locale]/favorites` · 个人主页(收藏列表 · Clerk 登录)
- `/api/health` · 健康占位
- `/api/{videos,videos/[slug],people/[slug],topics/[slug],search,favorites,admin/videos}` · 8 API
- `/api/ai/chat` · Edge Function · DeepSeek 代理

## 故障排查

| 症状 | 排查路径 |
|---|---|
| `npm run build` 报 `DATABASE_URL not set` | W3 已修(round-001 lazy init)· 拉最新 commit `4bca9cc` |
| `npm run tsc` 单独跑挂 `TS6046` | W4 已知 · 用 `npm run typecheck`(`next build` 内置 tsc)替代 · 见 `docs/04-evolve/known-tsc-issue.md` |
| `/api/search?mode=semantic` 返回 429 | W6 rate-limit 30/60s/IP · 正常防刷 · 若超 prod 真用户,Vercel env 改 `SEARCH_RATE_LIMIT_RPM=10/60s` |
| 视频详情页摘要空白(ai_status=pending) | ingest 未跑完 · `npx tsx src/scripts/ingest-video.ts --video-id N` 单条触发 |
| 双语切换缺翻译 | 应不可能(i18n 100% eval PASS)· 若发生检查 `app/messages/{zh,en}.json` diff |
| Clerk 登录 401 | 检查 Marketplace integration 是否 production env 注入 · 旧 `x-user-id` header 在 favorites + admin/videos 仍存在(W5 · D6 接 `auth()`)|
| LLM eval < 85% | 改 prompt(不改接口)· 跑 round-002 改进循环 |
| OpenAI 账单飙升 | 检查 `/api/search` rate-limit 是否生效 · Vercel logs grep `429` |
| Vercel 部署失败 | 查 `vercel logs <deployment-url>` · 通常是 env vars 漏配 |

## 监控与告警

**24h 内**(`docs/04-evolve/post-launch-checklist.md` T+24h):

- [ ] Vercel Analytics: 首页 LCP < 2.5s
- [ ] OpenAI 账单 < $1(若已超 → 改 `/api/search` rate-limit 30→10/60s)
- [ ] DeepSeek 账单 < $1(ingest 已完成,不应再涨)
- [ ] Clerk Dashboard: 登录流程无 error spike
- [ ] Vercel logs 无 5xx 报错堆积
- [ ] LLM eval 25 cases 真跑 ≥ 21 pass(N1 ≥ 85%)

**7 天 / 30 天**(`docs/04-evolve/post-launch-checklist.md` T+7d / T+30d):

- Lighthouse prod 真测(Perf ≥ 80 / A11y ≥ 90 / BP ≥ 90 / SEO ≥ 90)
- Twitter @simprr 推文互动数据(点击 / 转发 / 留言)
- LLM 准确率回测(case 量 5 → 30 · 看真实视频量降级与否)
- 收藏功能(W5 stub auth)是否接 Clerk `auth()` 排期
- round-002 触发条件:LLM eval < 85% / W5 接 Clerk / DAU > 50

**回滚预案**:

```bash
# 上线后 1h 内发现 P0 bug(白屏 / 数据库连不上 / Clerk 拒登录)
# 方式 A · Vercel dashboard → Deployments → 上一个 stable build → Promote to Production
# 方式 B · CLI
vercel rollback <previous-deployment-url>
```

## Vercel deploy 章节(hybrid project 补充)

本项目 stack = Next.js 15 + Clerk + Neon + DeepSeek · 完全 Vercel Marketplace 一体化:

1. `vercel link` 关联 Simprr team
2. Marketplace 装 Clerk + Neon → 自动注入 env
3. 手填 `DEEPSEEK_API_KEY` + `OPENAI_API_KEY`
4. `git push` 自动 preview / `vercel --prod` 手动 promote
5. domain `kdsj-world.vercel.app`(免费)或绑 `kdsj.world`(自有域)

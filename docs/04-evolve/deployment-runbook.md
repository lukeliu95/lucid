# kdsj-world · 上线部署单(9 步)

> 给 Alan 一个人,本地执行。预算 30 视频 ingest 约 $0.51 + Vercel/Neon 免费层。预期总耗时:**2-4 小时**(主要是 28 视频真 YouTube ID 回填 + ASR/LLM ingest 跑批)。

## Step 0 · 前置确认(5 分钟)

- [ ] `cd app && npm run build` PASS(本地复核)
- [ ] `git status` clean(本轮所有 changes 已 commit)
- [ ] 27 视频 `_DRAFT` ID 已**全部**替换为真实 11 字符 YouTube ID(`grep _DRAFT src/db/seed.ts` 应该返回 0 条 · 当下还有 27 条)
- [ ] DeepSeek key + OpenAI key + Clerk key 已就绪(查 1Password / Vercel team secrets)

## Step 1 · Vercel 项目创建(10 分钟)

```bash
cd app
vercel link
# - Scope: lukes-projects-xxx(Simprr personal team)
# - Project name: kdsj-world(新建)
# - Directory: ./(app/ 当前目录)
# - Link to existing GitHub repo? 是 → 选 simprr/kdsj-world
```

## Step 2 · Neon Postgres + pgvector(10 分钟)

```bash
# 通过 Vercel Marketplace 装 Neon(沿用 bazi-studio 流程)
# https://vercel.com/marketplace/neon → Add Integration → kdsj-world
# 自动注入 DATABASE_URL 到 production env

# 在 Neon dashboard SQL editor 跑一次:
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 3 · env vars 配置清单(10 分钟)

在 Vercel Project Settings → Environment Variables 添加(production + preview 都要):

| Key | 值来源 | 备注 |
|---|---|---|
| `DATABASE_URL` | Neon 自动注入 | 不用手填 |
| `DEEPSEEK_API_KEY` | DeepSeek 控制台 | 服务端 only |
| `OPENAI_API_KEY` | OpenAI 控制台 | 仅 embedding 用,$0.02/1M token |
| `CLERK_SECRET_KEY` | Clerk Marketplace 自动注入 | 装 Clerk integration 后自动 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | 同上 | 同上 |
| `NEXTAUTH_URL` | `https://kdsj.world` 或 vercel preview URL | 用于 Clerk redirect |

**严禁**: 把任何 key 写进代码 / .env.example / commit message。

## Step 4 · DB schema push(2 分钟)

```bash
cd app
vercel env pull .env.local   # 拉 DATABASE_URL 到本地
npx drizzle-kit push          # 把 schema.ts 推到 Neon
```

## Step 5 · seed 数据导入(2 分钟)

```bash
npx tsx src/db/seed.ts
# 应该 insert 5 topics + 10 people + 30 video stubs
# 此时所有 video 的 ai_status='pending',title/transcript 还没生成
```

## Step 6 · ingest 跑 30 视频(60-120 分钟)

```bash
# 单个测试(确认 pipeline 通)
DEEPSEEK_API_KEY=$REAL_KEY OPENAI_API_KEY=$REAL_KEY \
  npx tsx src/scripts/ingest-video.ts --video-id 1

# 跑全量(Bash for-loop 即可,或写个 batch script)
for i in $(seq 1 30); do
  echo "=== video $i ==="
  npx tsx src/scripts/ingest-video.ts --video-id $i || echo "FAIL $i, continue"
done
```

- 预算: 视频字幕 + DeepSeek 摘要 + OpenAI embedding ≈ $0.017/视频 × 30 = **$0.51**
- 失败的视频(`_DRAFT` 未填真 ID / 字幕拿不到)记下来,手工补

## Step 7 · Vercel 部署(5 分钟)

```bash
# Preview 先
vercel
# 拿到 preview URL 后,浏览器跑 smoke test:
#   - / 首页 30 视频卡片显示
#   - /videos/[slug] 摘要 + 关键点 + 时间轴 显示
#   - /search?q=ai+agent 返回结果
#   - 双语切换 OK

# Smoke test 全过 → promote 到 prod
vercel --prod
```

## Step 8 · 上线后 24h 内必跑(LLM eval 真测)

```bash
# 跑 25 cases × DeepSeek-v4-pro,详见 llm-eval-execution-plan.md
cd app
DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/llm-eval-suite/run-all.ts
# 期望: 25 cases ≥ 21 pass(≥ 85% 准确率)
# 不达标 → 改 prompt(不改接口),再跑
```

## Step 9 · 分发(10 分钟)

- [ ] Twitter @simprr 发推: 「看懂世界 v0.1 上线了 · 30 个 AI/科技/商业访谈 · 双语摘要 + 时间轴 + 双档解释 · https://kdsj.world」
- [ ] 朋友圈同步
- [ ] (可选)Hacker News Show HN

## 回滚预案

如 prod 上线后 1h 内发现 P0 bug(白屏 / 数据库连不上 / Clerk 拒登录):
```bash
# Vercel dashboard → Deployments → 上一个 stable build → Promote to Production
# 或 CLI:
vercel rollback <previous-deployment-url>
```

---

*老吴 · 2026-05-25 · 本文件 = 上线唯一合同*

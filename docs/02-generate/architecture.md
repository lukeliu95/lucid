# Backend Architecture · kdsj-world

> Phase B.2 · 大刘 · 2026-05-24
> 单仓 Next.js 15 App Router 项目,Edge runtime + Neon Postgres + pgvector + Drizzle ORM。
> LLM 唯一来源 = DeepSeek-v4-pro,通过 Edge Function 代理,key **0 暴露** 给前端。

---

## 1. 高层拓扑

```
┌──────────────────┐      HTTPS(SSE)         ┌────────────────────────┐
│ Browser (Next.js │ ───────────────────────▶│ /api/ai/chat (Edge)    │
│  小赵的页面)      │   POST {messages,locale}│  · rate-limit 30/60s   │
└──────┬───────────┘                          │  · model fallback      │
       │                                      └────────┬───────────────┘
       │ GET /api/videos /people /topics /search        │
       │ (Node runtime · Drizzle 直连)                   ▼
       ▼                                       ┌────────────────────┐
┌──────────────────┐    Drizzle SQL            │ DeepSeek API       │
│ Route Handlers   │ ─────────────────────────▶│ deepseek-v4-pro    │
│ (Edge for ai,    │                           │ → fallback deepseek│
│  Node for db)    │                           │   -chat            │
└──────┬───────────┘                           └────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Neon Postgres                                                    │
│   videos · videos_ai · people · topics · favorites               │
│   video_embeddings (pgvector dim=1536)                           │
│   full-text indexes (Chinese + English ts_vector)                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Offline pipeline (运营机器 · Node CLI · not on Vercel)            │
│   scripts/ingest-video.ts  →  Whisper local → S1..S4 → S8 embed  │
│   ──> writes videos / videos_ai / video_embeddings to Neon       │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Edge vs Node 边界

| Route | Runtime | 原因 |
|---|---|---|
| `/api/ai/chat` | **Edge** | 沿用 bazi-studio · SSE 流式低延迟 · key 只在此 |
| `/api/videos` `/[slug]` | Node | Drizzle + `@neondatabase/serverless` 可在 Edge 也可 Node;首版用 Node 简化 |
| `/api/people` `/topics` | Node | 同上 |
| `/api/search` (keyword) | Node | Postgres ILIKE / ts_vector |
| `/api/search` (semantic) | Node | embedding 调用 + pgvector query;embedding 走 OpenAI 服务端 key |
| `/api/health` | Node | 只 ping db |

> 升级路径: 上线后若 P95 > 400ms,把 read endpoint 迁 Edge(Drizzle + Neon HTTP 模式已支持)。

## 3. Key Isolation

| Secret | 位置 | 谁能读 |
|---|---|---|
| `DEEPSEEK_API_KEY` | Vercel env (Production / Preview) | 仅 `/api/ai/chat` route handler `process.env` 直读 |
| `OPENAI_API_KEY` | Vercel env | 仅 `src/lib/embedding.ts`(运行在 Node route handlers + ingest 脚本) |
| `DATABASE_URL` | Vercel env (Neon connection string) | 仅 `src/db/client.ts` |
| `CLERK_SECRET_KEY` | Vercel env | 仅 Clerk middleware |

**守门规则**:
- `src/app/**`(页面/组件)**禁止** 出现 `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` 字符串
- `src/lib/ai/deepseek.ts` 是唯一允许 read DEEPSEEK_API_KEY 的文件(从 route handler 调用)
- 浏览器 bundle 不含 server-only 模块(用 `import "server-only"` 守门)
- grep 命令(放进 CI):
  ```bash
  ! grep -r "DEEPSEEK_API_KEY" app/src/app/[locale] app/src/components 2>/dev/null
  ! grep -r "OPENAI_API_KEY"   app/src/app/[locale] app/src/components 2>/dev/null
  ```

## 4. 双语预生成流水线

> 核心原则: **DB 里所有 AI 字段都已经是双语**,运行时不调 LLM 翻译。前端读 `_zh` 或 `_en` 列即可。

```
ingest-video.ts (CLI)
  │
  ├─ 1. fetch transcript (YouTube caption API OR Whisper local SRT)
  ├─ 2. normalize transcript → plain text (transcript.txt) + (subtitle.srt)
  │
  ├─ 3. parallel fan-out:
  │     ├─ S1 summary-generator      (DeepSeek, single call returns {zh, en})
  │     ├─ S2 keypoints-extractor    (DeepSeek, single call returns {zh[], en[]})
  │     ├─ S3 timeline-builder       (Script: split + DeepSeek per segment, returns {zh[], en[]})
  │     └─ S4 two-tier-explainer     (DeepSeek, returns {quick: {zh,en}, deep: {zh,en}})
  │
  ├─ 4. S8 embedding · text-embedding-3-small (1536d)
  │     input = `${title_zh}\n${title_en}\n${summary_zh}\n${summary_en}` (双语混合 embed)
  │
  └─ 5. transactional write:
        videos → videos_ai → video_embeddings
        ai_status = "ai_done"
```

**双语策略**: 每个 S1-S4 prompt 显式要求 LLM 在**单次调用内**输出 JSON 双语字段,避免重复调用翻倍成本。

## 5. 在线请求路径

```
GET /api/videos
  → src/db: SELECT * FROM videos JOIN videos_ai JOIN people ORDER BY published_at DESC LIMIT 30
  → return VideoCard[]  (无需调 LLM)

GET /api/videos/[slug]
  → JOIN videos_ai · return VideoDetail (含完整 AI 字段)

GET /api/search?q=foo&mode=keyword
  → src/lib/search/keyword.ts · ILIKE on title_zh OR title_en OR keypoints

GET /api/search?q=foo&mode=semantic
  → src/lib/embedding.ts: query → 1536-d vec
  → pgvector: SELECT video_id FROM video_embeddings ORDER BY embedding <=> $1 LIMIT 5
  → fetch VideoCard for those ids

POST /api/ai/chat  (SSE)  — 预留 · MVP 不在 UI 暴露,仅给 admin 调试
```

## 6. 失败模式与降级

| 故障 | 行为 |
|---|---|
| Whisper 无字幕 | 标 `ai_status=failed` · 不写 videos_ai · UI 隐藏 AI 区块 |
| DeepSeek 5xx | 重试 ≤ 3 次指数退避;仍失败 → 此步落 `pipeline_run.status=failed`,人工触发重跑 |
| DeepSeek-v4-pro region 限 | 自动降级到 `deepseek-chat`(沿用 bazi-studio fallback) |
| OpenAI embedding 失败 | 视频可入库(只是搜索无 semantic)· 标 `embedding_status=missing` |
| Edge rate limit 命中 | 返 429 + `Retry-After` header |
| DB 连接抖动 | Neon HTTP driver 自带 5s retry · 透传 5xx 给前端 |

## 7. 性能预算

- `/api/videos` P95 ≤ 200ms (Neon HTTP + 单 JOIN + 30 行)
- `/api/videos/[slug]` P95 ≤ 250ms
- `/api/search?mode=semantic` P95 ≤ 600ms (embedding 调用 ~300ms + pgvector ~50ms)
- `/api/ai/chat` first-byte ≤ 1s (Edge cold start) · 后续 token stream 立即吐

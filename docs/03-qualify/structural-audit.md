# Structural Audit · kdsj-world Phase C

> 2026-05-24 · 阿May · 6 项静态结构 eval
> 全部基于 grep / 文件解析 / 计数,不调外部服务

---

## 总览

| # | 检查项 | 结果 | 备注 |
|---|---|---|---|
| 1 | i18n key 双侧对齐(zh.json ↔ en.json) | ✅ PASS | 111/111 完全匹配 · 0 漏 |
| 2 | mock data 30 视频字段完整性 | ✅ PASS | 30 stubs · 双语 _zh/_en 都齐 |
| 3 | API contract 一致性(handoff §3 ↔ types.ts ↔ routes ↔ components) | ✅ PASS | 9 路由全部使用 types.ts 类型 |
| 4 | DB schema 一致性(schema.ts ↔ API ↔ handoff) | ✅ PASS | 9 表 vs handoff §3 一致 |
| 5 | Edge Function key 隔离(DEEPSEEK / OPENAI 仅服务端) | ✅ PASS | 0 客户端泄漏 |
| 6 | rate limit 配置存在 + Footer Simprr 署名 | ⚠ PARTIAL | rate-limit 仅 ai/chat;Footer ✅ |

**Pass Rate: 5/6 完全通过 · 1/6 部分通过(rate-limit 覆盖面)**

---

## 1. i18n 双语对齐

```python
zh keys: 111
en keys: 111
zh - en missing: 0
en - zh missing: 0
overlap: 111
```

✅ **PASS** · 满足 intent-brief §6.2 "UI 双语切换 100% 无缺漏"。

---

## 2. mock data 30 视频字段

```
src/db/seed.ts:
  TOPICS: 5 (slug/name_zh/name_en/sort_order) ✅
  PEOPLE: 10 (slug/name_zh/name_en/title_zh/title_en) ✅
  VIDEOS: 30 (slug/platform/platform_id/person_slug/topic_slugs/title_zh/title_en/duration_sec) ✅
```

**双语字段统计**: 48 处 `_zh` 或 `_en` 后缀字段 · 全 stub 双语成对。

⚠ 注意: 30 视频中 29 个 `platform_id` 为 `PLACEHOLDERn`(W-ticket · 需 Phase D 运营回填真实 YouTube ID 才能跑 ASR)。`ai_status` 全 pending — 这是预期(LLM pipeline 上线后才跑)。

✅ **PASS**(结构合规)/ ⚠ 数据合规需 Phase D 补 28 条真实 platform_id。

---

## 3. API contract 一致性

handoff §3 定义的类型 vs `src/lib/types.ts` 实际导出:

| handoff type | types.ts | API route 使用 | 一致 |
|---|---|---|---|
| `Locale` | ✅ | middleware / pages | ✅ |
| `VideoCard` | ✅ | /api/videos GET | ✅ |
| `VideoDetail` | ✅ | /api/videos/[slug] | ✅ |
| `PersonDetail` | ✅ | /api/people/[slug] | ✅ |
| `TopicDetail` | ✅ | /api/topics/[slug] | ✅ |
| `SearchResults` | ✅ | /api/search | ✅ |
| `KeyPoint` `TimelineItem` `VideoAI` `SignatureView` | ✅ | nested | ✅ |
| `AIStatus` = pending/asr_done/ai_done/failed | ✅ | schema match | ✅ |

9 路由全部 import `@/lib/types`。✅ **PASS**.

---

## 4. DB schema 一致性

schema.ts 9 表:`videos`, `videos_ai`, `video_embeddings`, `people`, `topics`, `video_topics`, `favorites`, `pipeline_runs`, (Clerk 用户表 stub)

handoff §3 9 表 1:1 对应。

✅ **PASS**.

---

## 5. Key 隔离扫描

```
DEEPSEEK_API_KEY:
  src/lib/ai/deepseek.ts:19  process.env.DEEPSEEK_API_KEY
  src/lib/ai/deepseek.ts:20  throw if missing

OPENAI_API_KEY:
  src/lib/embedding.ts:10  process.env.OPENAI_API_KEY
  src/lib/embedding.ts:11  throw if missing
```

两 key **零次** 出现在 `components/*` 或 `app/[locale]/*`(客户端代码)。仅服务端 lib/ 使用。

Edge Function 调用链:
- client → /api/ai/chat → deepseek.ts (server only) ✅
- client → /api/search → embedding.ts (semantic path · server only) ✅

✅ **PASS** · 与 generate_summary.key_isolation_verified=true 一致。

---

## 6. Rate limit + Brand

**Rate limit**:
- `src/lib/rate-limit.ts` 实现 sliding window in-memory · DEFAULT = 30 req / 60s ✅(符合 intent §6.2 隐含约束)
- 应用于:`/api/ai/chat` (windowMs=60_000, max=30) ✅

⚠ **Coverage gap**: 仅 `ai/chat` 套了 rate-limit。其他 8 路由(/api/videos, /api/search, /api/people 等)无 rate-limit。

风险评估:
- /api/search 走 embedding(OpenAI 计费) → **应加** rate-limit(P2)
- /api/admin/* 走 Clerk auth(自带防滥用) → 可不加
- /api/videos · /api/people · /api/topics 纯读 DB → 暂可不加 · Vercel 平台层有 DDoS 防护

→ 记 **W6 工单 · 非阻塞**: Phase D 上线前给 /api/search 加 rate-limit (30/60s)。

**Brand**:
- `src/components/layout/footer.tsx:24` `href="https://x.com/simprr"` ✅
- `messages/zh.json:155` + `en.json:155` author_link = "x.com/simprr" ✅
- footer.tsx 在 layout 中全局加载 → 每页可见 ✅

✅ Brand PASS · ⚠ rate-limit PARTIAL(非阻塞).

---

## 结论

5/6 PASS + 1/6 PARTIAL · 无阻塞上线问题。生成 **W6 工单**(rate-limit 覆盖) + Phase D 运营补 28 条真实 platform_id。

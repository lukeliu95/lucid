# 08 · 接口契约

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: docs/02-generate/skills-spec.md + app/src/app/api/* + docs/02-generate/db-schema.md
> 自动化类型: ✅ 全自动

## Skill 对外触发协议

> hybrid project_type · 本项目 skill 没有 Claude SKILL.md frontmatter triggers · 触发方式为 API route / pipeline 内函数调用 / CLI script。下表为等价契约表。

| Skill | 触发方式 | 所需依赖 | 输入 | 输出 |
|---|---|---|---|---|
| **S1 summary-generator** | `pipeline.fanout(summary, ...)` 内部调用 | DeepSeek API key · `response_format: json_object` | `{ transcript: string, video_title: string }` | `{ summary_zh ≤80 字, summary_en ≤120 chars }` |
| **S2 keypoints-extractor** | pipeline 内调用 | DeepSeek API key | `{ transcript_with_timestamps: string }` | `{ keypoints_zh: KeyPoint[], keypoints_en: KeyPoint[] }`(5-10 条 · 每条 `{text, timestamp_sec?, source_span}`) |
| **S3 timeline-builder** | pipeline 内调用 | DeepSeek API key + SRT segments | `{ segments: [{start,end,text}] }` | `{ timeline_zh, timeline_en }`(每项 `{timestamp_sec, title, one_liner}` · 5-12 段) |
| **S4 two-tier-explainer** | pipeline 内调用 | DeepSeek API key | `{ transcript, summary_zh, summary_en }` | `{ explainer_quick_zh, explainer_quick_en, explainer_deep_zh, explainer_deep_en }` |
| **S5 person-aggregator** | `aggregate-person.ts` CLI / 异步 trigger | DB read | `{ person_id }` | UPDATE `people.signature_views_zh/en`(3-5 条) |
| **S6 video-crud** | `POST /api/admin/videos` · `GET /api/admin/videos` | Clerk auth(`ADMIN_USER_IDS`) + DB | `AdminVideoCreateRequest` | `{ video_id }` / 409 重复 / 401 未授权 |
| **S7 semantic-search** | `GET /api/search?mode=semantic&q=...` | OpenAI embedding API + pgvector + rate-limit(W6) | `q: string` | `VideoCard[]`(top-5) · embedding 5xx 时降级 keyword + `X-Search-Fallback: keyword` |
| **S8 keyword-search** | `GET /api/search?mode=keyword&q=...` | DB(trigram + tsvector) | `q: string` | top-20 视频 + 命中人物 + 命中主题 |
| **S9 orchestrator** | `npx tsx src/scripts/ingest-video.ts --video-id N` | DeepSeek + OpenAI + DB · `pipeline_runs` 表写状态 | `--video-id N` | 写 `videos_ai` + `video_embeddings` + UPDATE `videos.ai_status='ai_done'` + trigger S5 |
| **S10 favorite-crud** | `POST/DELETE/GET /api/favorites` | Clerk auth required | `{ video_id }` | INSERT/DELETE/列表 · 401 未登录 |

## 数据契约

### DB Schema(9 张表 · `docs/02-generate/db-schema.md` canonical)

| 表 | 用途 | 关键字段 |
|---|---|---|
| `videos` | 30 视频元数据 | platform, platform_id, title_zh, title_en, ai_status |
| `videos_ai` | LLM 产出 | summary_zh/en, keypoints_zh/en (JSONB), timeline_zh/en (JSONB), explainer_quick_zh/en, explainer_deep_zh/en |
| `video_embeddings` | 语义搜索向量 | video_id, embedding(`vector(1536)`) |
| `people` | 10 人物 | slug, name_zh, name_en, bio_zh, bio_en, signature_views_zh/en |
| `topics` | 5 主题 | slug, name_zh, name_en, description_zh/en |
| `video_people` | 视频↔人物多对多 | video_id, person_id |
| `video_topics` | 视频↔主题多对多 | video_id, topic_id |
| `favorites` | 用户收藏 | user_id (Clerk), video_id, UNIQUE(user_id, video_id) |
| `pipeline_runs` | 状态机 | video_id, step, status, error_msg, created_at |

详见 `docs/02-generate/db-schema.md`(全文 · 含字段类型 / 索引 / FK / pgvector 索引)。

### API Contract(9 routes · 详见 `app/src/app/api/`)

| Method + Path | 契约文档 | Auth |
|---|---|---|
| `GET /api/health` | 占位 health check | 公开 |
| `GET /api/videos` | list video cards(分页) | 公开 |
| `GET /api/videos/[slug]` | video detail + ai 内容 | 公开 |
| `GET /api/people/[slug]` | person + related videos | 公开 |
| `GET /api/topics/[slug]` | topic + videos | 公开 |
| `GET /api/search?q=&mode=keyword|semantic` | 搜索 | 公开 + W6 rate-limit 30/60s/IP |
| `POST/DELETE/GET /api/favorites` | 收藏 CRUD | Clerk required(W5 现 stub `x-user-id`) |
| `POST/GET /api/admin/videos` | 视频 CRUD | Clerk + `ADMIN_USER_IDS`(W5 现 stub) |
| `POST /api/ai/chat` | DeepSeek 代理(Edge Function) | server-side key only + rate-limit |

### 类型契约(TypeScript · 节选)

```ts
type VideoCard = {
  slug: string
  platform: 'youtube' | 'bilibili'
  platform_id: string
  title: { zh: string; en: string }
  guest_names: { zh: string; en: string }[]
  topic_slugs: string[]
  duration_sec: number
  one_liner: { zh: string; en: string }   // S1 summary
  ai_status: 'pending' | 'asr_done' | 'ai_done' | 'failed'
}

type KeyPoint = {
  text: string
  timestamp_sec?: number
  source_span: string  // ≤30 字原文锚点 · S2 反 hallucination
}

type TimelineNode = {
  timestamp_sec: number
  title: string
  one_liner: string
}
```

## 调用示例

### S1 summary-generator(eval-cases.md C1 · Sam Altman Lex #419)

```ts
// Input
{
  transcript: "[前 5000 tokens 节选 · sam-altman-lex-419]",
  video_title: "Sam Altman on GPT-5 & AGI · Lex Podcast #419"
}

// Expected Output(双语单调用 · response_format: json_object)
{
  summary_zh: "Sam Altman 在 Lex 第 419 期谈 GPT-5 训练规模、AGI 时间表与 OpenAI 内部张力,认为 2030 前 AGI 概率 > 50%。",  // ≤80 字
  summary_en: "Sam Altman on Lex #419 discusses GPT-5 training scale, AGI timeline, internal OpenAI tensions; >50% AGI probability by 2030."  // ≤120 chars
}

// Deterministic 校验
// - summary_zh.length ≤ 80(字)✓
// - summary_en.length ≤ 120(chars)✓
// - 非空 / 非串语 / 合法 JSON ✓
// - 反 hallucination: 不含 transcript 未提及的产品(e.g. "GPT-6")✓
```

### S8 keyword-search(中文 query · CJK 检测路径)

```bash
GET /api/search?q=AI%20Agent&mode=keyword
```

```json
{
  "videos": [
    {"slug": "karpathy-intro-llm", "title": {"zh": "Karpathy LLM 入门", "en": "Karpathy Intro to LLMs"}, "match_field": "title_zh"}
  ],
  "people": [{"slug": "karpathy", "name": {"zh": "Andrej Karpathy", "en": "Andrej Karpathy"}}],
  "topics": [{"slug": "ai-agent", "name": {"zh": "AI Agent", "en": "AI Agent"}}]
}
```

### S10 favorite-crud(幂等 POST)

```bash
POST /api/favorites
Cookie: __clerk_session=...
Body: { "video_id": 12 }

# 第一次 → 201 Created
# 重复 → 200 OK(UNIQUE 冲突幂等)
# 未登录 → 401 Unauthorized
```

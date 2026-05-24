# DB Schema · kdsj-world

> Neon Postgres + pgvector + Drizzle ORM。MVP 规模:30 videos · 10 people · 5 topics。
> Schema 源代码: `app/src/db/schema.ts`(canonical · 本文档与之同步)。

---

## 1. 扩展

```sql
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- trigram for fuzzy text
CREATE EXTENSION IF NOT EXISTS unaccent;     -- 英文 diacritics
```

## 2. 表

### 2.1 `topics`

| Column | Type | Note |
|---|---|---|
| id | serial PK | |
| slug | text UNIQUE NOT NULL | URL 段 · e.g. `ai-agent` |
| name_zh | text NOT NULL | |
| name_en | text NOT NULL | |
| intro_zh | text | |
| intro_en | text | |
| sort_order | int default 0 | 首页 TopicStrip 顺序 |
| created_at | timestamptz default now() | |

### 2.2 `people`

| Column | Type | Note |
|---|---|---|
| id | serial PK | |
| slug | text UNIQUE NOT NULL | |
| name_zh | text NOT NULL | |
| name_en | text NOT NULL | |
| title_zh | text | 头衔(双语) |
| title_en | text | |
| avatar_url | text | |
| bio_zh | text | |
| bio_en | text | |
| signature_views_zh | jsonb default '[]' | `[{quote, from_video_slug, from_video_title}]` |
| signature_views_en | jsonb default '[]' | S5 产出 |
| created_at | timestamptz | |

### 2.3 `videos`

| Column | Type | Note |
|---|---|---|
| id | serial PK | |
| slug | text UNIQUE NOT NULL | |
| platform | text NOT NULL CHECK in ('youtube','bilibili') | |
| platform_id | text NOT NULL | YouTube videoId 或 BV 号 |
| url | text NOT NULL | 原始链接 |
| cover_url | text | |
| title_zh | text NOT NULL | |
| title_en | text NOT NULL | |
| person_id | int FK people.id NOT NULL | |
| duration_sec | int NOT NULL default 0 | |
| published_at | timestamptz | |
| ai_status | text NOT NULL default 'pending' | enum: pending / asr_done / ai_done / failed |
| created_at | timestamptz default now() | |
| updated_at | timestamptz default now() | |

Indexes: `UNIQUE(platform, platform_id)` · `(person_id)` · `(ai_status)` · GIN tsv (见 §3).

### 2.4 `videos_topics` (M:N)

| video_id | int FK | |
| topic_id | int FK | |
| PRIMARY KEY (video_id, topic_id) | | |

### 2.5 `videos_ai` (1:1 with videos)

| Column | Type | Note |
|---|---|---|
| video_id | int PK FK videos.id ON DELETE CASCADE | |
| summary_zh | text | S1 |
| summary_en | text | S1 |
| keypoints_zh | jsonb default '[]' | S2 · `[{text, timestamp_sec?, source_span?}]` |
| keypoints_en | jsonb default '[]' | S2 |
| timeline_zh | jsonb default '[]' | S3 · `[{timestamp_sec, title, one_liner}]` |
| timeline_en | jsonb default '[]' | S3 |
| explainer_quick_zh | text | S4 |
| explainer_quick_en | text | S4 |
| explainer_deep_zh | text | S4 |
| explainer_deep_en | text | S4 |
| generated_at | timestamptz default now() | |
| model | text | e.g. `deepseek-v4-pro` |

### 2.6 `video_embeddings` (1:1 with videos)

| Column | Type | Note |
|---|---|---|
| video_id | int PK FK | |
| embedding | vector(1536) NOT NULL | OpenAI text-embedding-3-small |
| input_text | text | 用于 embed 的输入(便于回查/重跑) |
| created_at | timestamptz | |

Index: `CREATE INDEX ON video_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 32);`(30 视频规模其实 seq scan 已够,索引保留升级位)。

### 2.7 `favorites`

| Column | Type | Note |
|---|---|---|
| id | serial PK | |
| user_id | text NOT NULL | Clerk userId |
| video_id | int FK videos.id ON DELETE CASCADE | |
| created_at | timestamptz default now() | |

Indexes: `UNIQUE(user_id, video_id)` · `(user_id, created_at desc)`

### 2.8 `pipeline_runs` (S9 状态机)

| Column | Type | Note |
|---|---|---|
| id | serial PK | |
| video_id | int FK | |
| step | text | enum: `fetch_subtitle` / `whisper_asr` / `s1_summary` / `s2_keypoints` / `s3_timeline` / `s4_explainer` / `s8_embedding` / `db_write` |
| status | text | running / done / failed |
| attempts | int default 0 | |
| error_message | text | |
| started_at | timestamptz | |
| finished_at | timestamptz | |

## 3. 全文索引(关键词搜索 S8)

```sql
ALTER TABLE videos ADD COLUMN tsv_en tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title_en,''))) STORED;

ALTER TABLE videos_ai ADD COLUMN tsv_en tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(summary_en,'') || ' ' || coalesce(explainer_quick_en,''))
  ) STORED;

CREATE INDEX videos_tsv_en_idx     ON videos     USING gin(tsv_en);
CREATE INDEX videos_ai_tsv_en_idx  ON videos_ai  USING gin(tsv_en);

-- 中文不走 ts_vector(Postgres 缺中文分词内置)· 用 ILIKE + pg_trgm 兜底:
CREATE INDEX videos_title_zh_trgm   ON videos USING gin(title_zh gin_trgm_ops);
CREATE INDEX videos_ai_summary_zh_trgm ON videos_ai USING gin(summary_zh gin_trgm_ops);
```

## 4. 关系图(简)

```
topics ─┐
        ├─ videos_topics ─ videos ─┬─ videos_ai
people ─┘                          ├─ video_embeddings
                                   └─ favorites (─ Clerk user)
videos ─ pipeline_runs(多对1)
```

## 5. 迁移与种子

- Drizzle migration: `app/drizzle.config.ts` + `npx drizzle-kit push`(MVP 用 push,不走 migration 文件)
- Seed: `app/src/db/seed.ts` 读 `content-plan.md` 选片 → 写入 30 video stub(ai_status=pending,实际跑 ingest 才填 videos_ai)

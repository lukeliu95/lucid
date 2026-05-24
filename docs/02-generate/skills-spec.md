# 10 Backend Skills · Spec · kdsj-world

> 一一对应 `docs/01-discover/decomposition.md` § 1。
> 实现位置: `app/src/lib/` + `app/src/scripts/` + `app/src/app/api/`。

---

## S1 · summary-generator (Agent)

**对应**: REQ-V02
**实现**: `app/src/lib/ai/prompts/s1-summary.ts` + 调用 `app/src/lib/ai/deepseek.ts`

- **输入**: `{ transcript: string, video_title: string }`
- **输出**: `{ summary_zh: string (≤80 字), summary_en: string (≤120 chars) }`
- **Prompt 策略**(双语单调用): 给 LLM `response_format: { type: "json_object" }` + few-shot 示例,要求 zh 限 80 字、en 限 120 chars。
- **双语策略**: 单次调用同时生成中英,避免翻译漂移。
- **错误处理**: JSON 解析失败 → 重试 1 次 with stricter prompt;两次都失败 → throw,S9 标 `s1_summary=failed`。
- **预算**: 输入 ~5k token,输出 ~200 token,单次 ~$0.005。

---

## S2 · keypoints-extractor (Agent)

**对应**: REQ-V03
**实现**: `app/src/lib/ai/prompts/s2-keypoints.ts`

- **输入**: `{ transcript_with_timestamps: string }`(每行 `[mm:ss] ...`)
- **输出**: `{ keypoints_zh: KeyPoint[], keypoints_en: KeyPoint[] }` · 5-10 条 · `{text, timestamp_sec?, source_span}`
- **关键 prompt 锚句**: "禁止虚构。每条 keypoint 必须能在 transcript 找到锚点,把锚点片段填到 `source_span`(≤30 字原文)。如无锚点,丢弃此点。"
- **双语**: 单调用产双语数组,zh 与 en 一一对应(同一索引位)。
- **错误处理**: 若 source_span 不在 transcript 中(字符串包含验证) → 丢该条,不重试。

---

## S3 · timeline-builder (Hybrid)

**对应**: REQ-V04
**实现**: `app/src/lib/ai/prompts/s3-timeline.ts` (Agent 部分) + `app/src/lib/ai/pipeline.ts` (Script 切段)

- **Script 部分** (分段):
  - 输入: SRT segments `[{start, end, text}]`
  - 策略: 按 `≥ 6min` 长度滑窗 + 语义停顿启发(双换行 / 长停顿)
  - 输出: ≥ 5 段 · ≤ 12 段
- **Agent 部分** (命名):
  - 对每段调一次 DeepSeek,prompt = "用一句话给该段命名 + 一句话摘要,中英双语"
  - 单段调用预算 ~$0.003
- **最终输出**: `{ timeline_zh, timeline_en }` · 每项 `{timestamp_sec, title, one_liner}`
- **错误处理**: 任一段失败用占位 `{title: "未命名段落", one_liner: ""}`,不阻塞整体。

---

## S4 · two-tier-explainer (Agent)

**对应**: REQ-V05
**实现**: `app/src/lib/ai/prompts/s4-explainer.ts`

- **输入**: `{ transcript, summary_zh, summary_en }`
- **输出**:
  ```ts
  {
    explainer_quick_zh: string,  // 200-300 字
    explainer_quick_en: string,  // 250-400 chars
    explainer_deep_zh:  string,  // 800-1500 字
    explainer_deep_en:  string,  // 1000-2000 chars
  }
  ```
- **策略**: 单次调用 JSON 模式输出 4 字段,避免 4 次调用。
- **双语**: 同上单调用。
- **错误处理**: 字数检验失败 → 重试 1 次 with "字数严格控制" 强提示。

---

## S5 · person-profile-aggregator (Agent)

**对应**: REQ-P02
**实现**: `app/src/lib/ai/prompts/s5-person.ts` + `app/src/scripts/aggregate-person.ts`

- **触发**: 新视频 `ai_done` 后,对该 person 异步重算
- **输入**: SELECT 该 person 所有视频的 keypoints + summary
- **输出**: `{ signature_views_zh: SignatureView[], signature_views_en: SignatureView[] }` · 3-5 条
- **Prompt**: "从该人物所有视频中提炼 3-5 个代表性观点。每条标注来源视频。"
- **双语**: 单调用产双语。
- **写回**: UPDATE `people.signature_views_zh/en`。

---

## S6 · video-crud (Script)

**对应**: REQ-X01
**实现**: `app/src/app/api/admin/videos/route.ts`(POST/GET)

- **POST**: 接收 `AdminVideoCreateRequest`,写 videos 表(ai_status=pending),返回 video_id
- **GET**: 列出最近 30 条视频 + 状态
- **触发后续**: POST 成功后调用 `enqueueIngest(video_id)`(MVP 阶段是同步触发 ingest CLI 的占位 · Phase D 上 Vercel Cron / Inngest)
- **Auth**: Clerk · 只允许 `simprr` userId(env `ADMIN_USER_IDS`)
- **错误处理**: platform_id 重复 → 409

---

## S7 · semantic-search (Hybrid)

**对应**: REQ-S02
**实现**: `app/src/lib/search/semantic.ts` + `app/src/app/api/search/route.ts`

- **Script**: query → OpenAI text-embedding-3-small → 1536d vec → pgvector `<=>` cosine top-5
- **Agent (后续)**: MVP 不上 re-rank;预留 `rerank.ts` 接口
- **输出**: `VideoCard[]`
- **错误处理**: embedding API 5xx → 降级到 keyword 搜并附 warning header

---

## S8 · keyword-search (Script)

**对应**: REQ-S01
**实现**: `app/src/lib/search/keyword.ts`

- **策略**:
  - 中文: ILIKE `%q%` on title_zh + summary_zh + keypoints_zh::text (借 trigram 索引)
  - 英文: `to_tsquery('english', q)` on tsv_en
  - 自动语言检测: 含 CJK 字符 → 走中文路径
- **输出**: top-20 视频 + 命中人物(name match) + 命中主题(name match)

---

## S9 · ai-pipeline-orchestrator (Script)

**对应**: 编排 S1-S4 + S8
**实现**: `app/src/lib/ai/pipeline.ts` + CLI 入口 `app/src/scripts/ingest-video.ts`

- **触发**: CLI(`npx tsx src/scripts/ingest-video.ts --video-id 12`)
- **流程**:
  1. fetch_subtitle: 调用 YouTube caption / 本地 SRT 文件 → transcript_with_timestamps
  2. 若 subtitle 不存在 → 落 `ai_status=pending`(等运营机器跑 Whisper · 见 asr-spec.md)
  3. fan-out S1 / S2 / S3 / S4(`Promise.all`)
  4. S8 embedding(单调用)
  5. 事务写 videos_ai + video_embeddings + UPDATE videos.ai_status=`ai_done`
  6. 触发 S5 重算该 person
- **状态机**: 每步写 `pipeline_runs` 表(running → done / failed)
- **重试**: 单步 ≤ 3 次,指数退避(1s / 4s / 9s)

---

## S10 · favorite-crud (Script)

**对应**: REQ-U02/U03
**实现**: `app/src/app/api/favorites/route.ts`

- **POST**: `{ video_id }` → INSERT (user_id 取 Clerk session) · UNIQUE 冲突返 200(幂等)
- **DELETE**: `{ video_id }` → DELETE
- **GET**: 当前用户的 favorites · JOIN videos · 返回 VideoCard[]
- **Auth**: Clerk required · 未登录 → 401

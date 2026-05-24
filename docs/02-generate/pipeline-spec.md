# S9 Pipeline · Detailed Spec · kdsj-world

> 视频从入库到 `ai_status=ai_done` 的完整流水线。运营机器跑 · 非线上服务。

---

## 1. 入口

```bash
# 单视频
npx tsx app/src/scripts/ingest-video.ts \
  --url "https://www.youtube.com/watch?v=xxx" \
  --person-slug sam-altman \
  --topic-slugs ai,startup \
  --subtitle ./subtitles/sam-2024.srt   # 可选 · 没传走 Whisper

# 批量
npx tsx app/src/scripts/ingest-video.ts --batch content-plan.csv
```

## 2. State Machine

```
[pending] ─fetch_subtitle─▶ [subtitle_ready] ─s1..s4─▶ [ai_running] ─embed─▶ [ai_done]
   │
   └─no_subtitle─▶ [whisper_needed] ──(运营机器手动跑)──▶ [subtitle_ready]
   │
   └─任一步失败 3 次─▶ [failed]  (人工查 pipeline_runs)
```

## 3. 详细步骤

| # | Step | 实现 | 重试 | 失败行为 |
|---|---|---|---|---|
| 1 | fetch_subtitle | `lib/i18n-asr.ts:fetchYoutubeCaption()` | 2 | 标 whisper_needed,暂停 |
| 2 | parse_srt | `lib/i18n-asr.ts:parseSrt()` | 0 | 直接 fail |
| 3 | s1_summary | `lib/ai/prompts/s1-summary.ts` | 3 | fail · 不阻塞 s2-s4 |
| 4 | s2_keypoints | `lib/ai/prompts/s2-keypoints.ts` | 3 | fail |
| 5 | s3_timeline | `lib/ai/prompts/s3-timeline.ts` | 3 / 段 | 段级 fail · 整体可入库 |
| 6 | s4_explainer | `lib/ai/prompts/s4-explainer.ts` | 3 | fail |
| 7 | s8_embedding | `lib/embedding.ts` | 3 | warn · 不阻塞 ai_done |
| 8 | db_write | transaction in pipeline.ts | 1 | fail · rollback |
| 9 | trigger_s5 | `scripts/aggregate-person.ts` | 1 | warn · 异步独立 |

## 4. Fan-out 并行(本地)

S1 / S2 / S4 之间无依赖,`Promise.all` 三路并发。S3 因要每段单独调 LLM,串行执行 segments 内部循环。

```ts
const [s1, s2, s4] = await Promise.all([
  generateSummary(transcript),
  extractKeypoints(transcriptWithTs),
  generateExplainer(transcript, /* await s1 will be re-summary if needed */),
]);
const s3 = await buildTimeline(srtSegments);  // 串行 (segment loop)
const emb = await embedVideo({ title, summary: s1 });
await writeAll({ s1, s2, s3, s4, emb });
```

> 优化: 若想等 s1 出再做 s4,改成 `await s1Promise; s4 = await s4(...)`(s4 用 summary 当输入更稳)。MVP 阶段 s4 不依赖 s1(自己看 transcript)。

## 5. 双语预生成成本(单视频 · 30 min transcript ~ 8k token)

| Step | tokens in | tokens out | 调用次数 | DeepSeek cost (~$0.27/M in, $1.10/M out) |
|---|---|---|---|---|
| S1 | 8k | 400 (zh+en) | 1 | $0.0026 |
| S2 | 8k | 1.2k | 1 | $0.0035 |
| S3 (×8 段) | 1k×8 | 200×8 | 8 | $0.0040 |
| S4 | 8k | 4k | 1 | $0.0066 |
| S8 (OpenAI) | 1k | — | 1 | $0.00002 |
| **合计** | | | **12 calls** | **~$0.017 / video** |

30 视频 ≈ **$0.51 USD** 一次全量预生成。Phase D 重跑全部 < $1 跨夜。

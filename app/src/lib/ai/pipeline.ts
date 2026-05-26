/**
 * S9 · ai-pipeline-orchestrator
 * Fan-out S1-S4 + S8 embedding, transactional DB write.
 */
import "server-only";
import { db, schema } from "@/db/client";
import { eq, sql } from "drizzle-orm";
import { generateSummary } from "./prompts/s1-summary";
import { extractKeypoints } from "./prompts/s2-keypoints";
import { buildTimeline } from "./prompts/s3-timeline";
import { generateExplainer } from "./prompts/s4-explainer";
import { embedText, embedInputFromVideo } from "../embedding";
import { transcriptPlain, transcriptWithTimestamps } from "../i18n-asr";
import type { SrtSegment } from "./prompts/s3-timeline";

export type IngestInput = {
  video_id: number;
  video_title: string;
  srt: SrtSegment[];
};

export async function runPipeline(input: IngestInput): Promise<void> {
  const { video_id, video_title, srt } = input;
  const plain = transcriptPlain(srt);
  const stamped = transcriptWithTimestamps(srt);

  await recordStep(video_id, "s1_summary", "running");
  const [s1, s2, s4] = await Promise.all([
    retry(() => generateSummary({ transcript: plain, video_title })),
    retry(() => extractKeypoints({ transcript_with_timestamps: stamped })),
    retry(() => generateExplainer({ transcript: plain })),
  ]);
  await recordStep(video_id, "s1_summary", "done");
  await recordStep(video_id, "s2_keypoints", "done");
  await recordStep(video_id, "s4_explainer", "done");

  await recordStep(video_id, "s3_timeline", "running");
  const s3 = await retry(() => buildTimeline(srt));
  await recordStep(video_id, "s3_timeline", "done");

  await recordStep(video_id, "s8_embedding", "running");
  const embedInput = embedInputFromVideo({
    title_zh: video_title, title_en: video_title,
    summary_zh: s1.summary_zh, summary_en: s1.summary_en,
  });
  let embedding: number[] | null = null;
  try {
    embedding = await retry(() => embedText(embedInput));
  } catch (e) {
    await recordStep(video_id, "s8_embedding", "failed", (e as Error).message);
  }
  if (embedding) await recordStep(video_id, "s8_embedding", "done");

  await recordStep(video_id, "db_write", "running");
  await db.insert(schema.videos_ai).values({
    video_id,
    summary_zh: s1.summary_zh,
    summary_en: s1.summary_en,
    keypoints_zh: s2.keypoints_zh,
    keypoints_en: s2.keypoints_en,
    timeline_zh: s3.timeline_zh,
    timeline_en: s3.timeline_en,
    explainer_quick_zh: s4.explainer_quick_zh,
    explainer_quick_en: s4.explainer_quick_en,
    explainer_deep_zh: s4.explainer_deep_zh,
    explainer_deep_en: s4.explainer_deep_en,
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro",
  }).onConflictDoUpdate({
    target: schema.videos_ai.video_id,
    set: {
      summary_zh: s1.summary_zh,
      summary_en: s1.summary_en,
      keypoints_zh: s2.keypoints_zh,
      keypoints_en: s2.keypoints_en,
      timeline_zh: s3.timeline_zh,
      timeline_en: s3.timeline_en,
      explainer_quick_zh: s4.explainer_quick_zh,
      explainer_quick_en: s4.explainer_quick_en,
      explainer_deep_zh: s4.explainer_deep_zh,
      explainer_deep_en: s4.explainer_deep_en,
      generated_at: new Date(),
    },
  });

  if (embedding) {
    await db.insert(schema.video_embeddings).values({
      video_id,
      embedding,
      input_text: embedInput,
    }).onConflictDoUpdate({
      target: schema.video_embeddings.video_id,
      set: { embedding, input_text: embedInput, created_at: new Date() },
    });
  }

  await db.update(schema.videos)
    .set({ ai_status: "ai_done", updated_at: new Date() })
    .where(eq(schema.videos.id, video_id));

  await recordStep(video_id, "db_write", "done");
}

// -- helpers ------------------------------------------------------------

async function retry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = Math.pow(i + 1, 2) * 1000;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr ?? new Error("retry failed");
}

async function recordStep(video_id: number, step: string, status: string, err?: string) {
  // pipeline_runs 仅作可观测性日志 —— 写失败(如 Neon 连接抖动)不应让整条 ingest 崩。
  try {
    await db.execute(sql`
      INSERT INTO pipeline_runs (video_id, step, status, attempts, error_message, started_at, finished_at)
      VALUES (${video_id}, ${step}, ${status}, ${1}, ${err ?? null}, ${new Date()}, ${status === "running" ? null : new Date()})
    `);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[pipeline] recordStep(${step}) 写入失败(非致命): ${(e as Error).message}`);
  }
}

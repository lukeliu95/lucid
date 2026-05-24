/**
 * CLI: ingest one video through S1-S4 + embedding pipeline.
 *
 *   npx tsx src/scripts/ingest-video.ts --video-id 12 [--subtitle ./data/subtitles/xxx.srt]
 *
 * If --subtitle is omitted, tries YouTube auto caption. If neither available,
 * marks video as `whisper_needed` and exits (operator runs Whisper locally, see
 * docs/02-generate/asr-spec.md, then reruns with --subtitle).
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { fetchYoutubeCaption, readSrtFile } from "@/lib/i18n-asr";
import { runPipeline } from "@/lib/ai/pipeline";
import { aggregatePerson } from "@/lib/ai/prompts/s5-person";

async function main() {
  const { values } = parseArgs({
    options: {
      "video-id": { type: "string" },
      "subtitle": { type: "string" },
    },
  });

  const videoId = Number(values["video-id"]);
  if (!videoId) {
    console.error("--video-id required");
    process.exit(1);
  }

  const row = (await db.select().from(schema.videos).where(eq(schema.videos.id, videoId)).limit(1))[0];
  if (!row) {
    console.error("video not found");
    process.exit(1);
  }

  // 1. obtain subtitle
  let srt;
  if (values.subtitle) {
    console.log("reading SRT from", values.subtitle);
    srt = await readSrtFile(values.subtitle);
  } else if (row.platform === "youtube") {
    console.log("trying youtube auto-caption ...");
    srt = await fetchYoutubeCaption(row.platform_id, "en") ?? null;
  } else {
    srt = null;
  }

  if (!srt || srt.length === 0) {
    console.warn("no subtitle available · marking whisper_needed");
    await db.update(schema.videos)
      .set({ ai_status: "pending", updated_at: new Date() })
      .where(eq(schema.videos.id, videoId));
    console.log("→ now run Whisper locally (see docs/02-generate/asr-spec.md) then re-run with --subtitle");
    return;
  }

  console.log(`got ${srt.length} segments · running pipeline ...`);
  await runPipeline({ video_id: videoId, video_title: row.title_en, srt });

  // 2. trigger S5 person aggregation (best-effort)
  console.log("aggregating person profile ...");
  try {
    const person = (await db.select().from(schema.people).where(eq(schema.people.id, row.person_id)).limit(1))[0];
    if (person) {
      const videoRows = await db.select()
        .from(schema.videos)
        .innerJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
        .where(eq(schema.videos.person_id, person.id));
      const out = await aggregatePerson({
        person_name_zh: person.name_zh,
        person_name_en: person.name_en,
        videos: videoRows.map((r) => ({
          slug: r.videos.slug,
          title_zh: r.videos.title_zh,
          title_en: r.videos.title_en,
          keypoints_zh: r.videos_ai.keypoints_zh.map((k) => ({ text: k.text })),
          keypoints_en: r.videos_ai.keypoints_en.map((k) => ({ text: k.text })),
        })),
      });
      await db.update(schema.people).set({
        signature_views_zh: out.signature_views_zh,
        signature_views_en: out.signature_views_en,
      }).where(eq(schema.people.id, person.id));
    }
  } catch (e) {
    console.warn("S5 failed (non-fatal):", (e as Error).message);
  }

  console.log("done · ai_status=ai_done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

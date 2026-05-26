/**
 * 补 keypoints + 跑 S5(代表观点)· 针对中文 CC 批(S2 anchor 放宽后回填)。
 * runPipeline 不含 S5,且旧 S2 把中文 keypoints 全过滤掉了 → 这里重抓 CC、
 * 重跑 S2(已放宽 anchor)写回 keypoints,再按 person 跑 S5 填 signature_views。
 * 运行:DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/refresh-keypoints-s5.ts
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { readSrtFile, transcriptWithTimestamps } from "@/lib/i18n-asr";
import { extractKeypoints } from "@/lib/ai/prompts/s2-keypoints";
import { aggregatePerson } from "@/lib/ai/prompts/s5-person";

const VIDS = process.env.REFRESH_VIDS?.split(",") ?? [
  "ttkd0t5qTD4", // 姚顺宇
  "V9eI-t3TApE", // 罗福莉
  "rIwgZWzUKm8", // 谢赛宁 7h
  "c-ZVu-Cr1FQ", // 高继扬
];
const SUB_DIR = "/tmp/lucid-subs-zh";

function sh(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { encoding: "utf8" }).status === 0;
}
// Neon serverless 连接抖动重试。
async function retry<T>(fn: () => Promise<T>, n = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, (i + 1) * 2000)); }
  }
  throw last;
}
function fetchZhSub(pid: string): string | null {
  fs.mkdirSync(SUB_DIR, { recursive: true });
  const base = [
    "--sleep-requests", "3", "--retries", "10", "--extractor-retries", "5",
    "--extractor-args", "youtube:player_client=tv,web_safari,web",
    "--skip-download", "--write-auto-sub", "--write-sub",
    "--sub-lang", "zh-Hans,zh-Hant,zh-CN,zh",
    "-o", `${SUB_DIR}/%(id)s.%(ext)s`, `https://www.youtube.com/watch?v=${pid}`,
  ];
  if (!sh("yt-dlp", ["--impersonate", "chrome", ...base])) sh("yt-dlp", base);
  const cands = [`${pid}.zh-Hans.vtt`, `${pid}.zh-CN.vtt`, `${pid}.zh.vtt`, `${pid}.zh-Hant.vtt`];
  const found = cands.map((c) => path.join(SUB_DIR, c)).find((p) => fs.existsSync(p) && fs.statSync(p).size > 0);
  if (!found) return null;
  const srt = path.join(SUB_DIR, `${pid}.fixed.srt`);
  if (!sh("ffmpeg", ["-y", "-i", found, srt]) || !fs.existsSync(srt)) return null;
  return srt;
}

async function runS5(personId: number) {
  const person = (await db.select().from(schema.people).where(eq(schema.people.id, personId)).limit(1))[0];
  if (!person) return;
  const rows = await db.select()
    .from(schema.videos)
    .innerJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
    .where(eq(schema.videos.person_id, personId));
  const out = await aggregatePerson({
    person_name_zh: person.name_zh, person_name_en: person.name_en,
    videos: rows.map((r) => ({
      slug: r.videos.slug, title_zh: r.videos.title_zh, title_en: r.videos.title_en,
      keypoints_zh: r.videos_ai.keypoints_zh.map((k) => ({ text: k.text })),
      keypoints_en: r.videos_ai.keypoints_en.map((k) => ({ text: k.text })),
    })),
  });
  await db.update(schema.people).set({
    signature_views_zh: out.signature_views_zh, signature_views_en: out.signature_views_en,
  }).where(eq(schema.people.id, personId));
  console.log(`  S5 ${person.slug}: ${out.signature_views_zh.length} 条代表观点`);
}

async function main() {
  const personIds = new Set<number>();
  for (const pid of VIDS) {
    try {
      const v = (await retry(() => db.select().from(schema.videos).where(eq(schema.videos.platform_id, pid)).limit(1)))[0];
      if (!v) { console.log(`✗ ${pid} 不在库`); continue; }
      if (v.person_id) personIds.add(v.person_id);
      // 已有 keypoints 则跳过 S2(免得重跑长视频);仍参与 S5。
      const cur = (await retry(() => db.select({ kp: schema.videos_ai.keypoints_zh }).from(schema.videos_ai).where(eq(schema.videos_ai.video_id, v.id)).limit(1)))[0];
      if (cur && (cur.kp?.length ?? 0) > 0) { console.log(`= [${v.id}] ${pid} 已有 keypoints(${cur.kp.length}),跳过 S2`); continue; }
      const srt = fetchZhSub(pid);
      if (!srt) { console.log(`✗ ${pid} 无 CC`); continue; }
      const segs = await readSrtFile(srt);
      const stamped = transcriptWithTimestamps(segs);
      const kp = await extractKeypoints({ transcript_with_timestamps: stamped });
      await retry(() => db.update(schema.videos_ai).set({
        keypoints_zh: kp.keypoints_zh, keypoints_en: kp.keypoints_en,
      }).where(eq(schema.videos_ai.video_id, v.id)));
      console.log(`✓ [${v.id}] ${pid} keypoints zh=${kp.keypoints_zh.length} en=${kp.keypoints_en.length}`);
    } catch (e) {
      console.log(`✗ ${pid} · ${String(e).slice(0, 120)}`);
    }
  }
  console.log(`跑 S5 · ${personIds.size} 人...`);
  for (const pid of personIds) {
    try { await retry(() => runS5(pid)); } catch (e) { console.log(`✗ S5 person ${pid} · ${String(e).slice(0, 100)}`); }
  }
  console.log("[refresh] 完成");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

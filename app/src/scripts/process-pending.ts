/**
 * process-pending.ts — 持续入库 worker(GHA / 本地通用)。
 *
 * 流程:查 DB 里 ai_status=pending 且 platform_id 为合法 11 位 YouTube ID 的视频 →
 *   逐条:yt-dlp 抓字幕(优先 en-orig.vtt · 反限流参数)→ ffmpeg 转 srt →
 *   runPipeline(DeepSeek S1-S4)→ ai_status=ai_done。
 *
 * 运行:
 *   DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/process-pending.ts
 * GHA 里直接用 env secrets,无需 .env.local。
 *
 * 反限流:--sleep-requests + --retries + 多 player_client;失败不阻塞,逐条记录。
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { readSrtFile } from "@/lib/i18n-asr";
import { runPipeline } from "@/lib/ai/pipeline";

const VALID_YT = /^[A-Za-z0-9_-]{11}$/;
const SUB_DIR = path.resolve(process.cwd(), "data/subtitles");
const MAX_PER_RUN = Number(process.env.INGEST_MAX_PER_RUN ?? "8"); // 每次跑最多几条,控成本

function sh(cmd: string, args: string[]): boolean {
  const r = spawnSync(cmd, args, { stdio: "ignore", timeout: 5 * 60 * 1000 });
  return r.status === 0;
}

/** yt-dlp 抓字幕 → 返回转好的 srt 路径(或 null)。 */
function fetchSubtitle(pid: string): string | null {
  fs.mkdirSync(SUB_DIR, { recursive: true });
  const baseArgs = [
    "--sleep-requests", "3",
    "--retries", "10",
    "--extractor-retries", "5",
    "--extractor-args", "youtube:player_client=tv,web_safari,web",
    "--skip-download", "--write-auto-sub", "--write-sub",
    "--sub-lang", "en.*",
    "-o", `${SUB_DIR}/%(id)s.%(ext)s`,
    `https://www.youtube.com/watch?v=${pid}`,
  ];
  // 数据中心 IP(GHA)会被 YouTube bot 检测封锁 → 用 impersonation(curl_cffi)伪装真实浏览器破解。
  // 优先 chrome,失败回退无 impersonation(本地 brew yt-dlp 可能没装 curl_cffi)。
  const imp = sh("yt-dlp", ["--impersonate", "chrome", ...baseArgs]);
  if (!imp) sh("yt-dlp", baseArgs);
  // 优先原始完整字幕 en-orig,其次 en
  const candidates = [`${pid}.en-orig.vtt`, `${pid}.en.vtt`, `${pid}.en-orig.srt`, `${pid}.en.srt`];
  const found = candidates.map((c) => path.join(SUB_DIR, c)).find((p) => fs.existsSync(p) && fs.statSync(p).size > 0);
  if (!found) return null;
  if (found.endsWith(".srt")) return found;
  const srt = path.join(SUB_DIR, `${pid}.fixed.srt`);
  if (!sh("ffmpeg", ["-y", "-i", found, srt]) || !fs.existsSync(srt)) return null;
  return srt;
}

async function main() {
  const rows = (await db.query.videos.findMany({
    where: (v, { eq: e, and: a }) => a(e(v.ai_status, "pending"), e(v.platform, "youtube")),
  })) as unknown as Array<{ id: number; platform_id: string; title_en: string }>;

  const todo = rows.filter((v) => VALID_YT.test(v.platform_id) && v.platform_id !== "abcdEF12345").slice(0, MAX_PER_RUN);
  console.log(`[process-pending] pending=${rows.length} · 本次处理=${todo.length}`);

  let ok = 0, fail = 0;
  for (const v of todo) {
    try {
      console.log(`→ [${v.id}] ${v.platform_id} 抓字幕...`);
      const srt = fetchSubtitle(v.platform_id);
      if (!srt) { console.warn(`  [${v.id}] 无字幕(可能需 Whisper 兜底)— 跳过`); fail++; continue; }
      const segments = await readSrtFile(srt);
      if (segments.length === 0) { console.warn(`  [${v.id}] 字幕解析为空 — 跳过`); fail++; continue; }
      console.log(`  [${v.id}] ${segments.length} 段 · 跑 DeepSeek...`);
      await runPipeline({ video_id: v.id, video_title: v.title_en, srt: segments });
      ok++;
      console.log(`  [${v.id}] ✓ ai_done`);
    } catch (e) {
      fail++;
      console.error(`  [${v.id}] FAIL: ${(e as Error).message}`);
    }
  }
  console.log(`[process-pending] done · ok=${ok} fail=${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * 无中文 CC 的视频:走本地 Whisper(whisper.cpp large-v3)转写 → 管线 → S5。
 * 张小珺频道 7 条无 CC 的访谈。可断点续跑(ai_done 跳过 + 单条容错)。
 * 运行:DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/whisper-ingest-zh.ts
 * 需要:yt-dlp / ffmpeg / whisper-cli(brew whisper-cpp)+ large-v3 模型。
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";
import { readSrtFile } from "@/lib/i18n-asr";
import { runPipeline } from "@/lib/ai/pipeline";
import { aggregatePerson } from "@/lib/ai/prompts/s5-person";

const MODEL = process.env.WHISPER_MODEL ||
  `${process.env.HOME}/.cache/hyperframes/whisper/models/ggml-large-v3.bin`;
const WORK = "/tmp/lucid-whisper";

type Pn = { slug: string; name_zh: string; name_en: string; title_zh: string; title_en: string };
const PEOPLE: Pn[] = [
  { slug: "ji-yichao", name_zh: "季逸超", name_en: "Peak Ji", title_zh: "Manus 联合创始人兼首席科学家", title_en: "Co-founder & Chief Scientist, Manus" },
  { slug: "yang-zhilin", name_zh: "杨植麟", name_en: "Yang Zhilin", title_zh: "月之暗面 Kimi 创始人", title_en: "Founder, Moonshot AI (Kimi)" },
  { slug: "zhang-peng", name_zh: "张鹏", name_en: "Zhang Peng", title_zh: "智谱 AI CEO", title_en: "CEO, Zhipu AI" },
  { slug: "shunyu-yao", name_zh: "姚顺雨", name_en: "Shunyu Yao", title_zh: "OpenAI 研究员 · Agent 研究", title_en: "Researcher, OpenAI · Agents" },
  { slug: "yin-qi", name_zh: "印奇", name_en: "Yin Qi", title_zh: "阶跃星辰董事长 · 旷视创始人", title_en: "Chairman, StepFun · Founder, Megvii" },
  { slug: "tan-jie", name_zh: "谭捷", name_en: "Tan Jie", title_zh: "Google DeepMind 研究员 · 机器人", title_en: "Researcher, Google DeepMind · Robotics" },
  { slug: "kai-fu-lee", name_zh: "李开复", name_en: "Kai-Fu Lee", title_zh: "创新工场董事长 · 零一万物创始人", title_en: "Chairman, Sinovation · Founder, 01.AI" },
];
type Vn = { vid: string; person: string; title_zh: string; topics: string[] };
const VIDEOS: Vn[] = [
  { vid: "UqMtkgQe-kI", person: "ji-yichao", title_zh: "季逸超:Manus 被收购前的最后访谈 — 2025 这奇幻的漂流", topics: ["ai", "startup"] },
  { vid: "91fmhAnECVc", person: "yang-zhilin", title_zh: "杨植麟:Kimi K2、Agentic LLM、缸中之脑与无限的开端", topics: ["ai"] },
  { vid: "toy8RLeFZ08", person: "zhang-peng", title_zh: "张鹏:智谱 IPO、中国大模型第一股,敢问路在何方", topics: ["ai", "startup"] },
  { vid: "gQgKkUsx5q0", person: "shunyu-yao", title_zh: "姚顺雨:6 年 Agent 研究、人与系统、吞噬的边界", topics: ["ai"] },
  { vid: "gWmyu3x5rXY", person: "yin-qi", title_zh: "印奇:阶跃星辰、智能的诱惑、超长链路的残酷淘汰赛", topics: ["ai", "startup"] },
  { vid: "2o281Zy5aZE", person: "tan-jie", title_zh: "谭捷:机器人、跨本体、世界模型、Gemini Robotics 1.5", topics: ["ai"] },
  { vid: "fZB74w6jg7U", person: "kai-fu-lee", title_zh: "李开复:如果美国形成 AGI 霸权,我们应该怎么办", topics: ["ai", "startup"] },
];

function sh(cmd: string, args: string[], timeoutMs = 0): boolean {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: timeoutMs || undefined, maxBuffer: 1 << 28 });
  return r.status === 0;
}
async function retry<T>(fn: () => Promise<T>, n = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, (i + 1) * 2000)); }
  }
  throw last;
}
function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

/** 下音频 → 16k mono wav → whisper-cli large-v3 中文 → srt 路径(或 null)。 */
function whisperTranscribe(pid: string): string | null {
  fs.mkdirSync(WORK, { recursive: true });
  const raw = path.join(WORK, `${pid}.wav`);
  const wav16 = path.join(WORK, `${pid}.16k.wav`);
  const outBase = path.join(WORK, `${pid}.out`);
  const srt = `${outBase}.srt`;
  if (fs.existsSync(srt) && fs.statSync(srt).size > 0) return srt; // 续跑:已转写
  if (!fs.existsSync(wav16)) {
    const dl = ["-f", "bestaudio", "-x", "--audio-format", "wav", "-o", raw,
      `https://www.youtube.com/watch?v=${pid}`];
    if (!sh("yt-dlp", ["--impersonate", "chrome", ...dl])) sh("yt-dlp", dl);
    if (!fs.existsSync(raw)) return null;
    if (!sh("ffmpeg", ["-y", "-i", raw, "-ar", "16000", "-ac", "1", wav16])) return null;
    try { fs.unlinkSync(raw); } catch { /* noop */ }
  }
  // whisper.cpp:large-v3 中文转写,输出 srt
  // -mc 0:断开上下文喂入,防 whisper 自我循环幻觉(某段卡住反复输出同一句,
  //        如李开复那条"GPU的价值是什么"×数千);-et 2.8:高熵触发解码回退。
  if (!sh("whisper-cli", ["-m", MODEL, "-l", "zh", "-mc", "0", "-et", "2.8", "-osrt", "-of", outBase, "-t", "8", wav16])) return null;
  return fs.existsSync(srt) ? srt : null;
}

async function runS5(personId: number) {
  const person = (await retry(() => db.select().from(schema.people).where(eq(schema.people.id, personId)).limit(1)))[0];
  if (!person) return;
  const rows = await retry(() => db.select().from(schema.videos)
    .innerJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
    .where(eq(schema.videos.person_id, personId)));
  const out = await aggregatePerson({
    person_name_zh: person.name_zh, person_name_en: person.name_en,
    videos: rows.map((r) => ({
      slug: r.videos.slug, title_zh: r.videos.title_zh, title_en: r.videos.title_en,
      keypoints_zh: r.videos_ai.keypoints_zh.map((k) => ({ text: k.text })),
      keypoints_en: r.videos_ai.keypoints_en.map((k) => ({ text: k.text })),
    })),
  });
  await retry(() => db.update(schema.people).set({
    signature_views_zh: out.signature_views_zh, signature_views_en: out.signature_views_en,
  }).where(eq(schema.people.id, personId)));
  console.log(`  S5 ${person.slug}: ${out.signature_views_zh.length} 条`);
}

async function main() {
  if (!fs.existsSync(MODEL)) { console.error(`✗ whisper 模型不存在: ${MODEL}`); process.exit(1); }
  for (const p of PEOPLE) await retry(() => db.insert(schema.people).values(p).onConflictDoNothing());
  console.log("people ensured · model:", path.basename(MODEL));

  let ok = 0, fail = 0, skipped = 0;
  const personIds = new Set<number>();
  for (const v of VIDEOS) {
    try {
      const person = (await retry(() => db.select().from(schema.people).where(eq(schema.people.slug, v.person)).limit(1)))[0];
      if (person) personIds.add(person.id);
      const meta = await fetchVideoMetadata(v.vid);
      if (!meta) { console.log(`✗ ${v.vid} 无元数据`); fail++; continue; }
      const slug = slugify(`${person.slug}-${meta.title}`) || `${person.slug}-${v.vid}`;
      const ins = await retry(() => db.insert(schema.videos).values({
        slug, platform: "youtube", platform_id: v.vid,
        url: `https://www.youtube.com/watch?v=${v.vid}`, cover_url: thumbnailUrl(v.vid, "maxres"),
        title_zh: v.title_zh, title_en: meta.title, person_id: person.id,
        duration_sec: meta.durationSec ?? 0,
        published_at: meta.publishedAt ? new Date(meta.publishedAt) : null, ai_status: "pending",
      }).onConflictDoNothing().returning({ id: schema.videos.id }));
      let vidId: number;
      if (ins.length === 0) {
        const ex = (await retry(() => db.select({ id: schema.videos.id, st: schema.videos.ai_status }).from(schema.videos).where(eq(schema.videos.platform_id, v.vid)).limit(1)))[0];
        vidId = ex.id;
        if (ex.st === "ai_done") { console.log(`= ${v.vid} 已 ai_done,跳过`); skipped++; continue; }
      } else {
        vidId = ins[0].id;
        for (const ts of v.topics) {
          const t = (await retry(() => db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1)))[0];
          if (t) await retry(() => db.insert(schema.videos_topics).values({ video_id: vidId, topic_id: t.id }).onConflictDoNothing());
        }
      }
      console.log(`→ [${vidId}] ${v.vid} (${Math.round((meta.durationSec ?? 0) / 60)}min) Whisper 转写...`);
      const srt = whisperTranscribe(v.vid);
      if (!srt) { console.log(`  [${vidId}] ✗ Whisper 失败`); fail++; continue; }
      const segs = await readSrtFile(srt);
      console.log(`  [${vidId}] ${segs.length} 段 · 跑 DeepSeek...`);
      await runPipeline({ video_id: vidId, video_title: v.title_zh, srt: segs });
      ok++;
      console.log(`  [${vidId}] ✓ ai_done · /zh/videos/${slug}`);
    } catch (e) {
      fail++;
      console.log(`✗ ${v.vid} · ${String(e).slice(0, 160)}`);
    }
  }
  console.log(`跑 S5 · ${personIds.size} 人...`);
  for (const pid of personIds) {
    try { await runS5(pid); } catch (e) { console.log(`✗ S5 ${pid} · ${String(e).slice(0, 100)}`); }
  }
  console.log(`[whisper-zh] 完成 · ok=${ok} skipped=${skipped} fail=${fail}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

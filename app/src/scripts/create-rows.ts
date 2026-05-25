/**
 * round-013c 一次性批量建行:把 17 条真实 YouTube 视频元数据写入 DB(ai_status=pending)。
 * 仅用 YouTube Data API 抓元数据 + 人工中文标题;AI 速读由后续 ingest-video.ts 生成。
 * 跳过已在库的 5MWT_doo68k / hmtuvNfytjM。
 *   npx tsx src/scripts/create-rows.ts
 */
import "dotenv/config";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";

type NewPerson = { slug: string; name_zh: string; name_en: string; title_zh: string; title_en: string };
const newPeople: NewPerson[] = [
  { slug: "ilya-sutskever", name_zh: "Ilya Sutskever", name_en: "Ilya Sutskever", title_zh: "SSI 联合创始人 · 前 OpenAI 首席科学家", title_en: "Co-founder, SSI · ex-OpenAI Chief Scientist" },
  { slug: "yann-lecun", name_zh: "Yann LeCun", name_en: "Yann LeCun", title_zh: "Meta 首席 AI 科学家 · 图灵奖得主", title_en: "Chief AI Scientist, Meta · Turing Award" },
];

type V = { person_slug: string; vid: string; title_zh: string; topics: string[] };
const videos: V[] = [
  { person_slug: "dario-amodei", vid: "ugvHCXCOmm4", title_zh: "Dario Amodei:Claude、AGI 与人类的未来(Lex 5 小时长谈)", topics: ["ai", "future-of-work"] },
  { person_slug: "andrej-karpathy", vid: "LCEmiRjPEtQ", title_zh: "Andrej Karpathy:软件又变了(Software 3.0)", topics: ["ai", "future-of-work"] },
  { person_slug: "andrej-karpathy", vid: "zjkBMFhNj_g", title_zh: "Andrej Karpathy:大语言模型入门一小时", topics: ["ai"] },
  { person_slug: "andrej-karpathy", vid: "lXUZvyajciY", title_zh: "Andrej Karpathy:AGI 还要十年(Dwarkesh 访谈)", topics: ["ai", "future-of-work"] },
  { person_slug: "demis-hassabis", vid: "-HzgcbRXUK8", title_zh: "Demis Hassabis:AI、模拟现实与科学前沿(Lex #475)", topics: ["ai"] },
  { person_slug: "sam-altman", vid: "jvqFAi7vkBc", title_zh: "Sam Altman:OpenAI、GPT-5、董事会风波与 AGI(Lex #419)", topics: ["ai", "startup"] },
  { person_slug: "marc-andreessen", vid: "OHWnPOKh_S0", title_zh: "Marc Andreessen:科技、权力与美国的未来(Lex #458)", topics: ["startup", "ai", "future-of-work"] },
  { person_slug: "jensen-huang", vid: "vif8NQcjVf0", title_zh: "黄仁勋:4 万亿美元的 NVIDIA 与 AI 革命(Lex #494)", topics: ["chip", "ai"] },
  { person_slug: "jensen-huang", vid: "7ARBJQn6QkM", title_zh: "黄仁勋:NVIDIA 眼中的未来", topics: ["chip", "ai", "future-of-work"] },
  { person_slug: "naval-ravikant", vid: "3qHkcs3kG44", title_zh: "Naval Ravikant:财富、杠杆与判断力(JRE #1309)", topics: ["startup"] },
  { person_slug: "naval-ravikant", vid: "KyfUysrNaco", title_zh: "Naval Ravikant:关于人生游戏的 44 条硬道理", topics: ["startup", "future-of-work"] },
  { person_slug: "paul-graham", vid: "f4_14pZlJBs", title_zh: "Paul Graham:创业之前你该知道的(YC 创业课第 3 讲)", topics: ["startup"] },
  { person_slug: "paul-graham", vid: "FlCWg-KkUN4", title_zh: "Paul Graham:如何获得创业点子", topics: ["startup"] },
  { person_slug: "patrick-collison", vid: "WU-lBOAS1VQ", title_zh: "Patrick Collison:工艺、美与支付的未来(Dwarkesh 访谈)", topics: ["startup", "future-of-work"] },
  { person_slug: "ilya-sutskever", vid: "aR20FWCCjAs", title_zh: "Ilya Sutskever:从 scaling 时代走向研究时代", topics: ["ai"] },
  { person_slug: "yann-lecun", vid: "5t1vTLU7s40", title_zh: "Yann LeCun:Meta AI、开源、LLM 的极限与 AGI(Lex #416)", topics: ["ai"] },
  { person_slug: "sam-altman", vid: "2P27Ef-LLuQ", title_zh: "Sam Altman:OpenAI 如何取胜、算力建设与 2026 上市设想", topics: ["ai", "startup"] },
];

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

async function main() {
  for (const p of newPeople) {
    await db.insert(schema.people).values({
      slug: p.slug, name_zh: p.name_zh, name_en: p.name_en,
      title_zh: p.title_zh, title_en: p.title_en,
    }).onConflictDoNothing();
  }
  console.log("people ensured");

  let created = 0, skipped = 0, failed = 0;
  for (const v of videos) {
    try {
      const person = (await db.select().from(schema.people).where(eq(schema.people.slug, v.person_slug)).limit(1))[0];
      if (!person) { console.warn("skip(person missing):", v.person_slug); skipped++; continue; }
      const meta = await fetchVideoMetadata(v.vid);
      if (!meta) { console.warn("skip(no metadata):", v.vid); skipped++; continue; }
      const slug = slugify(`${person.slug}-${meta.title}`) || slugify(`${person.slug}-${v.vid}`);
      const inserted = await db.insert(schema.videos).values({
        slug,
        platform: "youtube",
        platform_id: v.vid,
        url: `https://www.youtube.com/watch?v=${v.vid}`,
        cover_url: thumbnailUrl(v.vid, "maxres"),
        title_zh: v.title_zh,
        title_en: meta.title,
        person_id: person.id,
        duration_sec: meta.durationSec ?? 0,
        published_at: meta.publishedAt ? new Date(meta.publishedAt) : null,
        ai_status: "pending",
      }).onConflictDoNothing().returning({ id: schema.videos.id });
      if (inserted.length === 0) { console.log("exists(skip):", v.vid); skipped++; continue; }
      const videoId = inserted[0].id;
      for (const ts of v.topics) {
        const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
        if (t) await db.insert(schema.videos_topics).values({ video_id: videoId, topic_id: t.id }).onConflictDoNothing();
      }
      created++;
      console.log(`created id=${videoId} ${v.vid} (${meta.durationSec}s) "${meta.title.slice(0, 48)}"`);
    } catch (e) {
      failed++;
      console.error("FAIL", v.vid, (e as Error).message);
    }
  }
  console.log(`done · created=${created} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

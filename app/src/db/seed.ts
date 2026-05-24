/**
 * Seed: 5 topics + 10 people + 30 video stubs (ai_status=pending).
 * Reads content from docs/01-discover/content-plan.md — values inlined to
 * avoid runtime fs in Vercel build.
 *
 * Run: `npx tsx src/db/seed.ts`
 */
import "dotenv/config";
import { db, schema } from "./client";

const TOPICS = [
  { slug: "ai", name_zh: "AI 与未来", name_en: "AI & The Future", sort_order: 1 },
  { slug: "ai-agent", name_zh: "AI Agent", name_en: "AI Agents", sort_order: 2 },
  { slug: "startup", name_zh: "创业与商业", name_en: "Startup & Business", sort_order: 3 },
  { slug: "chip", name_zh: "芯片与算力", name_en: "Chips & Compute", sort_order: 4 },
  { slug: "future-of-work", name_zh: "未来工作", name_en: "Future of Work", sort_order: 5 },
];

const PEOPLE = [
  { slug: "sam-altman",        name_zh: "山姆·奥特曼", name_en: "Sam Altman",        title_zh: "OpenAI CEO",            title_en: "CEO, OpenAI" },
  { slug: "andrej-karpathy",   name_zh: "安德烈·卡帕西", name_en: "Andrej Karpathy",  title_zh: "AI 研究者 / 教育者",     title_en: "AI Researcher / Educator" },
  { slug: "demis-hassabis",    name_zh: "戴密斯·哈萨比斯", name_en: "Demis Hassabis", title_zh: "DeepMind CEO",          title_en: "CEO, Google DeepMind" },
  { slug: "jensen-huang",      name_zh: "黄仁勋",        name_en: "Jensen Huang",      title_zh: "Nvidia CEO",            title_en: "CEO, Nvidia" },
  { slug: "dario-amodei",      name_zh: "达里奥·阿莫迪",  name_en: "Dario Amodei",      title_zh: "Anthropic CEO",        title_en: "CEO, Anthropic" },
  { slug: "naval-ravikant",    name_zh: "纳瓦尔·拉维坎特", name_en: "Naval Ravikant",  title_zh: "AngelList 创始人",      title_en: "Founder, AngelList" },
  { slug: "marc-andreessen",   name_zh: "马克·安德森",    name_en: "Marc Andreessen",  title_zh: "a16z 合伙人",           title_en: "Partner, a16z" },
  { slug: "patrick-collison",  name_zh: "帕特里克·柯里森", name_en: "Patrick Collison", title_zh: "Stripe CEO",          title_en: "CEO, Stripe" },
  { slug: "elon-musk",         name_zh: "埃隆·马斯克",    name_en: "Elon Musk",         title_zh: "Tesla / SpaceX / xAI 创始人", title_en: "Founder, Tesla / SpaceX / xAI" },
  { slug: "lex-fridman",       name_zh: "莱克斯·弗里德曼", name_en: "Lex Fridman",     title_zh: "AI 研究者 / 播客主持人", title_en: "AI Researcher / Podcast Host" },
];

// 30 video stubs — Phase D operator fills real urls + runs ingest.
type VideoStub = {
  slug: string; platform: "youtube"; platform_id: string;
  person_slug: string; topic_slugs: string[];
  title_zh: string; title_en: string;
  duration_sec: number;
};

const VIDEOS: VideoStub[] = [
  // ai
  { slug: "sam-altman-lex-419",     platform: "youtube", platform_id: "jvqFAi7vkBc", person_slug: "sam-altman",      topic_slugs: ["ai"],         title_zh: "Sam Altman 谈 GPT-5 与 AGI · Lex 访谈",       title_en: "Sam Altman on GPT-5 & AGI · Lex Podcast #419",     duration_sec: 7200 },
  { slug: "sam-altman-ted-2024",    platform: "youtube", platform_id: "PLACEHOLDER1", person_slug: "sam-altman",     topic_slugs: ["ai"],         title_zh: "Sam Altman · TED 2024 · AI 的未来",          title_en: "Sam Altman · TED 2024 · The Future of AI",         duration_sec: 1800 },
  { slug: "karpathy-intro-llm",     platform: "youtube", platform_id: "zjkBMFhNj_g", person_slug: "andrej-karpathy", topic_slugs: ["ai"],         title_zh: "Karpathy · LLM 入门一小时",                  title_en: "Karpathy · Intro to LLMs (1h)",                    duration_sec: 3600 },
  { slug: "karpathy-lex-latest",    platform: "youtube", platform_id: "PLACEHOLDER2", person_slug: "andrej-karpathy", topic_slugs: ["ai", "future-of-work"], title_zh: "Karpathy · Lex 长访谈", title_en: "Karpathy · Lex Podcast (Latest)",                  duration_sec: 10800 },
  { slug: "hassabis-lex",           platform: "youtube", platform_id: "PLACEHOLDER3", person_slug: "demis-hassabis", topic_slugs: ["ai"],         title_zh: "Hassabis · Lex / 60 Minutes",                title_en: "Demis Hassabis · Lex Interview",                  duration_sec: 5400 },
  { slug: "amodei-ezra-klein",      platform: "youtube", platform_id: "PLACEHOLDER4", person_slug: "dario-amodei",   topic_slugs: ["ai"],         title_zh: "Dario Amodei · Ezra Klein 节目",             title_en: "Dario Amodei · Ezra Klein Show",                  duration_sec: 4200 },
  { slug: "musk-xai-2024",          platform: "youtube", platform_id: "PLACEHOLDER5", person_slug: "elon-musk",      topic_slugs: ["ai"],         title_zh: "Elon Musk · xAI 与 Grok",                    title_en: "Elon Musk · xAI & Grok",                          duration_sec: 3600 },
  { slug: "lex-ai-roundup",         platform: "youtube", platform_id: "PLACEHOLDER6", person_slug: "lex-fridman",    topic_slugs: ["ai"],         title_zh: "Lex Fridman · AI 年度回顾",                  title_en: "Lex Fridman · AI Year in Review",                 duration_sec: 4800 },
  // ai-agent
  { slug: "karpathy-agent-future",  platform: "youtube", platform_id: "PLACEHOLDER7", person_slug: "andrej-karpathy", topic_slugs: ["ai-agent"],   title_zh: "Karpathy · Agent 是软件 3.0",                title_en: "Karpathy · Agents are Software 3.0",              duration_sec: 3600 },
  { slug: "sam-agent-vision",       platform: "youtube", platform_id: "PLACEHOLDER8", person_slug: "sam-altman",      topic_slugs: ["ai-agent"],   title_zh: "Sam · Agent 时代的工作流",                   title_en: "Sam Altman · Workflows in the Agent Era",          duration_sec: 2700 },
  { slug: "naval-agent-econ",       platform: "youtube", platform_id: "PLACEHOLDER9", person_slug: "naval-ravikant",  topic_slugs: ["ai-agent", "future-of-work"], title_zh: "Naval · Agent 经济学", title_en: "Naval · The Economics of Agents",                  duration_sec: 1800 },
  { slug: "a16z-agent-stack",       platform: "youtube", platform_id: "PLACEHOLDER10", person_slug: "marc-andreessen", topic_slugs: ["ai-agent", "startup"], title_zh: "Andreessen · Agent 技术栈", title_en: "Andreessen · The Agent Stack",                     duration_sec: 3000 },
  { slug: "stripe-agent-commerce",  platform: "youtube", platform_id: "PLACEHOLDER11", person_slug: "patrick-collison", topic_slugs: ["ai-agent", "startup"], title_zh: "Collison · Agent 与商业基础设施", title_en: "Collison · Agents & Commerce Infra",              duration_sec: 2400 },
  { slug: "amodei-agent-safety",    platform: "youtube", platform_id: "PLACEHOLDER12", person_slug: "dario-amodei",   topic_slugs: ["ai-agent"],   title_zh: "Dario · Agent 安全",                          title_en: "Dario · Agent Safety",                            duration_sec: 3300 },
  // startup
  { slug: "naval-how-to-get-rich",  platform: "youtube", platform_id: "PLACEHOLDER13", person_slug: "naval-ravikant",  topic_slugs: ["startup"],    title_zh: "Naval · 如何不靠运气致富",                   title_en: "Naval · How to Get Rich (without luck)",          duration_sec: 5400 },
  { slug: "naval-lex",              platform: "youtube", platform_id: "PLACEHOLDER14", person_slug: "naval-ravikant",  topic_slugs: ["startup", "future-of-work"], title_zh: "Naval · Lex 访谈", title_en: "Naval · Lex Podcast",                              duration_sec: 7200 },
  { slug: "andreessen-tech-stack",  platform: "youtube", platform_id: "PLACEHOLDER15", person_slug: "marc-andreessen", topic_slugs: ["startup"],    title_zh: "Andreessen · 软件吃世界",                    title_en: "Andreessen · Software Eats the World",             duration_sec: 3600 },
  { slug: "collison-stripe-story",  platform: "youtube", platform_id: "PLACEHOLDER16", person_slug: "patrick-collison", topic_slugs: ["startup"],   title_zh: "Collison · Stripe 早期故事",                 title_en: "Collison · The Early Stripe Story",                duration_sec: 4200 },
  { slug: "musk-first-principles",  platform: "youtube", platform_id: "PLACEHOLDER17", person_slug: "elon-musk",       topic_slugs: ["startup"],    title_zh: "Musk · 第一性原理",                          title_en: "Elon Musk · First Principles Thinking",            duration_sec: 1800 },
  { slug: "sam-yc-talk",            platform: "youtube", platform_id: "PLACEHOLDER18", person_slug: "sam-altman",      topic_slugs: ["startup"],    title_zh: "Sam · YC 创业讲座",                          title_en: "Sam Altman · YC Startup Talk",                     duration_sec: 2700 },
  // chip
  { slug: "jensen-gtc-2024",        platform: "youtube", platform_id: "PLACEHOLDER19", person_slug: "jensen-huang",    topic_slugs: ["chip"],       title_zh: "黄仁勋 · GTC 2024 主题演讲",                 title_en: "Jensen Huang · GTC 2024 Keynote",                  duration_sec: 7200 },
  { slug: "jensen-acquired",        platform: "youtube", platform_id: "PLACEHOLDER20", person_slug: "jensen-huang",    topic_slugs: ["chip", "startup"], title_zh: "黄仁勋 · Acquired 访谈", title_en: "Jensen Huang · Acquired Interview",                duration_sec: 10800 },
  { slug: "jensen-future-compute",  platform: "youtube", platform_id: "PLACEHOLDER21", person_slug: "jensen-huang",    topic_slugs: ["chip", "ai"], title_zh: "黄仁勋 · 算力的未来",                          title_en: "Jensen Huang · The Future of Compute",             duration_sec: 3600 },
  { slug: "karpathy-gpu-talk",      platform: "youtube", platform_id: "PLACEHOLDER22", person_slug: "andrej-karpathy", topic_slugs: ["chip"],       title_zh: "Karpathy · GPU 与训练",                       title_en: "Karpathy · GPUs & Training",                       duration_sec: 4200 },
  { slug: "musk-dojo-chip",         platform: "youtube", platform_id: "PLACEHOLDER23", person_slug: "elon-musk",       topic_slugs: ["chip"],       title_zh: "Musk · Tesla Dojo 芯片",                      title_en: "Musk · Tesla Dojo Chip",                          duration_sec: 1800 },
  // future-of-work
  { slug: "sam-future-work",        platform: "youtube", platform_id: "PLACEHOLDER24", person_slug: "sam-altman",      topic_slugs: ["future-of-work"], title_zh: "Sam · AI 时代的工作", title_en: "Sam Altman · Work in the AI Era",                  duration_sec: 2400 },
  { slug: "naval-leverage",         platform: "youtube", platform_id: "PLACEHOLDER25", person_slug: "naval-ravikant",  topic_slugs: ["future-of-work"], title_zh: "Naval · 杠杆与自动化", title_en: "Naval · Leverage & Automation",                    duration_sec: 1500 },
  { slug: "andreessen-future-work", platform: "youtube", platform_id: "PLACEHOLDER26", person_slug: "marc-andreessen", topic_slugs: ["future-of-work"], title_zh: "Andreessen · 未来工作", title_en: "Andreessen · The Future of Work",                  duration_sec: 3000 },
  { slug: "lex-future-essay",       platform: "youtube", platform_id: "PLACEHOLDER27", person_slug: "lex-fridman",     topic_slugs: ["future-of-work"], title_zh: "Lex · 未来工作随笔", title_en: "Lex · Essay on Future Work",                       duration_sec: 1800 },
  { slug: "musk-jobs-2040",         platform: "youtube", platform_id: "PLACEHOLDER28", person_slug: "elon-musk",       topic_slugs: ["future-of-work"], title_zh: "Musk · 2040 年还有工作吗", title_en: "Musk · Will Jobs Exist in 2040",                  duration_sec: 2700 },
];

async function main() {
  console.log("seeding topics ...");
  for (const t of TOPICS) {
    await db.insert(schema.topics).values(t).onConflictDoNothing();
  }
  console.log("seeding people ...");
  for (const p of PEOPLE) {
    await db.insert(schema.people).values(p).onConflictDoNothing();
  }
  console.log("seeding videos ...");
  for (const v of VIDEOS) {
    const persons = await db.select().from(schema.people);
    const personMap = new Map(persons.map((p) => [p.slug, p.id] as const));
    const personId = personMap.get(v.person_slug);
    if (!personId) { console.warn("skip · unknown person", v.person_slug); continue; }

    const inserted = await db.insert(schema.videos).values({
      slug: v.slug,
      platform: v.platform,
      platform_id: v.platform_id,
      url: `https://www.youtube.com/watch?v=${v.platform_id}`,
      title_zh: v.title_zh,
      title_en: v.title_en,
      person_id: personId,
      duration_sec: v.duration_sec,
      ai_status: "pending",
    }).onConflictDoNothing().returning({ id: schema.videos.id });

    const videoId = inserted[0]?.id;
    if (!videoId) continue;

    const topicsAll = await db.select().from(schema.topics);
    const topicMap = new Map(topicsAll.map((t) => [t.slug, t.id] as const));
    for (const ts of v.topic_slugs) {
      const tid = topicMap.get(ts);
      if (tid) {
        await db.insert(schema.videos_topics)
          .values({ video_id: videoId, topic_id: tid })
          .onConflictDoNothing();
      }
    }
  }
  console.log("seed done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

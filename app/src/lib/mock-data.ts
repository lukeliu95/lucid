import type {
  Topic,
  PersonRef,
  PersonDetail,
  VideoCard,
  VideoDetail,
  TopicDetail,
  SearchResults,
} from "./types";

// ---------- TOPICS (5) ----------
export const topics: Topic[] = [
  { slug: "ai",              name_zh: "AI",       name_en: "AI" },
  { slug: "ai-agent",        name_zh: "AI Agent", name_en: "AI Agent" },
  { slug: "startup",         name_zh: "创业",     name_en: "Startup" },
  { slug: "chip",            name_zh: "芯片",     name_en: "Chip" },
  { slug: "future-of-work",  name_zh: "未来工作", name_en: "Future of Work" },
];

const topicMap = Object.fromEntries(topics.map((t) => [t.slug, t]));

// ---------- PEOPLE (10) ----------
const peopleSeed: Array<{
  slug: string;
  name_zh: string;
  name_en: string;
  title_zh: string;
  title_en: string;
  bio_zh: string;
  bio_en: string;
}> = [
  {
    slug: "dario-amodei",
    name_zh: "Dario Amodei",
    name_en: "Dario Amodei",
    title_zh: "Anthropic CEO · AI 安全研究者",
    title_en: "CEO of Anthropic · AI Safety Researcher",
    bio_zh:
      "Dario 是 Anthropic 联合创始人,前 OpenAI 研究副总裁。他在 GPT-2 / GPT-3 的早期工作中扮演了关键角色,2021 年与 Daniela 一起出走创办 Anthropic,目标是把 AI 安全研究做成一个营利性公司的核心商业逻辑而非外挂。他的判断在 AI 圈内具有特殊权重——既是技术第一线,也是政策与公共讨论的常客。",
    bio_en:
      "Dario is co-founder of Anthropic and former VP of Research at OpenAI. He played a key role in GPT-2 and GPT-3 before co-founding Anthropic in 2021 with his sister Daniela, with the mission of making AI safety the central commercial logic of a for-profit company rather than a side concern.",
  },
  {
    slug: "sam-altman",
    name_zh: "Sam Altman",
    name_en: "Sam Altman",
    title_zh: "OpenAI CEO",
    title_en: "CEO of OpenAI",
    bio_zh: "OpenAI CEO,Y Combinator 前主席,长期观察并塑造硅谷创业生态。",
    bio_en: "CEO of OpenAI, former president of Y Combinator.",
  },
  {
    slug: "demis-hassabis",
    name_zh: "Demis Hassabis",
    name_en: "Demis Hassabis",
    title_zh: "Google DeepMind CEO",
    title_en: "CEO of Google DeepMind",
    bio_zh: "DeepMind 联合创始人,AlphaFold 背后推手,神经科学家与国际象棋大师。",
    bio_en: "Co-founder of DeepMind, driver of AlphaFold, neuroscientist and chess master.",
  },
  {
    slug: "andrej-karpathy",
    name_zh: "Andrej Karpathy",
    name_en: "Andrej Karpathy",
    title_zh: "独立 AI 研究者",
    title_en: "Independent AI Researcher",
    bio_zh: "前特斯拉 AI 总监,OpenAI 创始团队成员,系统讲解 agent 设计哲学。",
    bio_en: "Former Tesla AI director, founding member of OpenAI, expositor of agent design.",
  },
  {
    slug: "lex-fridman",
    name_zh: "Lex Fridman",
    name_en: "Lex Fridman",
    title_zh: "AI 研究者 · 长访谈主播",
    title_en: "AI researcher · Long-form podcaster",
    bio_zh: "MIT 研究员、长访谈播客主理人,常邀请 AI / 科学界关键嘉宾。",
    bio_en: "MIT researcher and long-form podcaster.",
  },
  {
    slug: "naval-ravikant",
    name_zh: "Naval Ravikant",
    name_en: "Naval Ravikant",
    title_zh: "AngelList 创始人 · 投资人",
    title_en: "Founder of AngelList · Investor",
    bio_zh: "AngelList 创始人,长期表达关于杠杆、判断力、复利的思想。",
    bio_en: "Founder of AngelList, long known for ideas on leverage, judgement and compounding.",
  },
  {
    slug: "jensen-huang",
    name_zh: "Jensen Huang",
    name_en: "Jensen Huang",
    title_zh: "NVIDIA CEO",
    title_en: "CEO of NVIDIA",
    bio_zh: "NVIDIA 创始人 CEO,推动 GPU 成为 AI 时代的基础设施。",
    bio_en: "Founder and CEO of NVIDIA, drove GPUs to become the substrate of the AI era.",
  },
  {
    slug: "marc-andreessen",
    name_zh: "Marc Andreessen",
    name_en: "Marc Andreessen",
    title_zh: "a16z 创始合伙人",
    title_en: "Co-founder of a16z",
    bio_zh: "Netscape 联合创始人,a16z 合伙人,Software is eating the world 作者。",
    bio_en: "Co-founder of Netscape and a16z, author of 'Software is eating the world'.",
  },
  {
    slug: "paul-graham",
    name_zh: "Paul Graham",
    name_en: "Paul Graham",
    title_zh: "Y Combinator 创始人",
    title_en: "Co-founder of Y Combinator",
    bio_zh: "Y Combinator 联合创始人,长期影响硅谷创业方法论。",
    bio_en: "Co-founder of Y Combinator, long-time shaper of startup methodology.",
  },
  {
    slug: "patrick-collison",
    name_zh: "Patrick Collison",
    name_en: "Patrick Collison",
    title_zh: "Stripe CEO",
    title_en: "CEO of Stripe",
    bio_zh: "Stripe 联合创始人,关注进步研究、科学生产力与互联网基础设施。",
    bio_en: "Co-founder of Stripe, interested in progress studies and internet infrastructure.",
  },
];

const personRef = (p: { slug: string; name_zh: string; name_en: string }): PersonRef => ({
  slug: p.slug,
  name_zh: p.name_zh,
  name_en: p.name_en,
});

// ---------- VIDEOS (30) ----------
// minimal template; first one has full AI content, others use shared filler
const longBlurbZh =
  "Dario 在这期访谈中给出了他对 powerful AI 何时到来的清晰时间表 —— 大约在 2027 年前后,我们就将见到能完成博士级科研工作的 AI 系统。他强调,这不是 AGI 的定义之争,而是一个实用主义的判断:当 AI 能持续地、可靠地完成需要多年博士训练才能完成的任务时,世界已经被改变。关于安全,他给出了一个反直觉的结论 —— 安全研究并不是等 AI 强了再做的事,而是必须在过程中持续做。Anthropic 的整个组织设计,从 Claude 的 RLHF 到 Constitutional AI,都是这个思路的产物。商业模式上,Anthropic 走的是 API-first 而非应用层的路线。这是一个相对克制的选择:把消费者应用层留给生态,自己专注做最底层的智能体能力供给。";

const longBlurbEn =
  "In this conversation Dario lays out a concrete timeline for the arrival of powerful AI — by roughly 2027 we will see systems able to perform PhD-level research tasks. He stresses that this is not a definitional debate about AGI but a pragmatic call: when AI can reliably complete tasks that take years of doctoral training, the world has already changed. On safety he offers a counter-intuitive view — alignment research is not what you do after AGI arrives, it is the process itself. Anthropic's organisational design, from RLHF on Claude to Constitutional AI, is a product of that view. On business model Anthropic is API-first rather than consumer-app first — a relatively restrained choice: leave the consumer app layer to the ecosystem and focus on the underlying agentic capability supply.";

const deepBlurbZh =
  "深度版进一步展开:Dario 将 powerful AI 的能力门槛锚定在'诺贝尔奖级别科学家'之上,而不是泛化的 AGI 概念。他论证芯片与算力是物理瓶颈,但在 2027 之前不会成为硬约束 —— 真正的瓶颈在数据、算法和组织能力,而 Anthropic 的赌注是 alignment 与 scaling 必须并行。从政策角度,他呼吁出口管制并非阻断技术,而是给 alignment 研究争取时间。";

const deepBlurbEn =
  "The deep dive extends further: Dario pins the powerful-AI threshold to 'Nobel-laureate-level scientist' rather than the diffuse AGI concept. He argues chips and compute are physical bottlenecks but not binding before 2027 — the real bottlenecks are data, algorithms and org capacity, and Anthropic's bet is that alignment and scaling must move in lockstep. On policy, he frames export controls not as halting technology but as buying time for alignment research.";

const fullAI = (idx: number): VideoDetail["ai"] => ({
  summary_zh: idx === 1
    ? "Anthropic CEO 描绘清晰路线图——2027 前我们将见到能完成博士级科研工作的 powerful AI 系统。"
    : `这是第 ${idx} 期的一句话总结 · AI 处理已完成 · 中文版本。`,
  summary_en: idx === 1
    ? "Anthropic CEO sketches a clear roadmap — by 2027 we will see powerful AI systems able to do PhD-level scientific work."
    : `One-sentence summary for episode ${idx} · AI processing complete · English version.`,
  keypoints_zh: [
    { text: "Powerful AI 不等同 AGI,但能完成大多数博士级科研任务,5 年内到来。", timestamp_sec: 134, source_span: "transcript:2:14-3:00" },
    { text: "安全研究 alignment 不是 AGI 之后的事,而是过程本身。", timestamp_sec: 530, source_span: "transcript:8:50-9:30" },
    { text: "Anthropic 的商业模型以 Claude API 为锚,而非 to-consumer 应用层。", timestamp_sec: 912 },
    { text: "芯片与算力是物理瓶颈,但不会成为 2027 前的硬限制。", timestamp_sec: 1320 },
    { text: "Anthropic 不追求 AGI 比赛第一,追求安全曲线第一。", timestamp_sec: 1710 },
  ],
  keypoints_en: [
    { text: "Powerful AI is not AGI, but it can complete most PhD-level research tasks within five years.", timestamp_sec: 134 },
    { text: "Alignment research is not 'after AGI' — it is the process itself.", timestamp_sec: 530 },
    { text: "Anthropic's business model is anchored on Claude API rather than consumer apps.", timestamp_sec: 912 },
    { text: "Chips and compute are physical bottlenecks but not binding before 2027.", timestamp_sec: 1320 },
    { text: "Anthropic does not race to AGI first; it races to safety curve first.", timestamp_sec: 1710 },
  ],
  timeline_zh: [
    { timestamp_sec: 0,    title: "引子",          one_liner: "嘉宾简介与本期主旨" },
    { timestamp_sec: 204,  title: "Agent 概念源起", one_liner: "从 RL 到 LLM-based agent 的演化" },
    { timestamp_sec: 530,  title: "模型选择",      one_liner: "为什么是 Claude · alignment 优先" },
    { timestamp_sec: 912,  title: "商业化路径",    one_liner: "API-first vs 消费者应用" },
    { timestamp_sec: 1320, title: "未来 5 年",     one_liner: "powerful AI 的具体时间表" },
    { timestamp_sec: 1710, title: "Q&A",          one_liner: "听众提问与展望" },
  ],
  timeline_en: [
    { timestamp_sec: 0,    title: "Opening",        one_liner: "Guest intro and theme." },
    { timestamp_sec: 204,  title: "Origins of agents", one_liner: "From RL to LLM-based agents." },
    { timestamp_sec: 530,  title: "Model choice",   one_liner: "Why Claude · alignment-first." },
    { timestamp_sec: 912,  title: "Path to revenue", one_liner: "API-first vs consumer apps." },
    { timestamp_sec: 1320, title: "Next 5 years",   one_liner: "A concrete powerful-AI timetable." },
    { timestamp_sec: 1710, title: "Q&A",           one_liner: "Audience questions and outlook." },
  ],
  explainer_quick_zh: longBlurbZh,
  explainer_quick_en: longBlurbEn,
  explainer_deep_zh: longBlurbZh + "\n\n" + deepBlurbZh,
  explainer_deep_en: longBlurbEn + "\n\n" + deepBlurbEn,
});

type VideoSeed = {
  slug: string;
  title_zh: string;
  title_en: string;
  one_liner_zh?: string;
  one_liner_en?: string;
  person_slug: string;
  duration_sec: number;
  topic_slugs: string[];
  platform: "youtube" | "bilibili";
  platform_id: string;
};

const videoSeeds: VideoSeed[] = [
  { slug: "dario-powerful-ai-5y", title_zh: "未来 5 年:Powerful AI 将全面到来", title_en: "Next 5 Years: Powerful AI Arrives In Full",
    one_liner_zh: "Anthropic CEO 描绘清晰路线图——2027 前我们将见到能完成博士级科研工作的 AI 系统。",
    one_liner_en: "Anthropic CEO sketches a clear roadmap — by 2027 we will see powerful AI.",
    person_slug: "dario-amodei", duration_sec: 2843, topic_slugs: ["ai"], platform: "youtube", platform_id: "abcdEF12345" },
  { slug: "karpathy-agent-architecture", title_zh: "Andrej Karpathy 讲清楚 Agent 架构", title_en: "Skill Issue: Andrej Karpathy on Code Agents, AutoResearch, and the Loopy Era of AI",
    person_slug: "andrej-karpathy", duration_sec: 3992, topic_slugs: ["ai-agent"], platform: "youtube", platform_id: "kwSVtQ7dziU" },
  { slug: "jensen-chip-next-decade", title_zh: "Jensen Huang 谈芯片下一个十年", title_en: "Nvidia CEO Huang Expects to Make $1 Trillion From AI Chips",
    person_slug: "jensen-huang", duration_sec: 192, topic_slugs: ["chip"], platform: "youtube", platform_id: "witILEF-OhQ" },
  { slug: "pg-zero-to-one", title_zh: "Paul Graham:0→1 创业心法", title_en: "Paul Graham, Founder of Y Combinator, Live from Stockholm",
    person_slug: "paul-graham", duration_sec: 1318, topic_slugs: ["startup"], platform: "youtube", platform_id: "QHJkUw31YX8" },
  { slug: "sam-next-18-months", title_zh: "Sam Altman:接下来 18 个月", title_en: "Sam Altman Shows Me GPT 5... And What's Next",
    person_slug: "sam-altman", duration_sec: 3907, topic_slugs: ["ai"], platform: "youtube", platform_id: "hmtuvNfytjM" },
  { slug: "naval-leverage-compounding", title_zh: "Naval:杠杆与判断力的复利", title_en: "Arm Yourself With Specific Knowledge",
    person_slug: "naval-ravikant", duration_sec: 381, topic_slugs: ["startup"], platform: "youtube", platform_id: "E-wCAXBHnic" },
  { slug: "demis-alphafold-beyond", title_zh: "Demis Hassabis 谈 AlphaFold 之后", title_en: "A new era of discovery: AI and the frontiers of science with Demis Hassabis",
    person_slug: "demis-hassabis", duration_sec: 2568, topic_slugs: ["ai"], platform: "youtube", platform_id: "dgBLVm2L1P4" },
  { slug: "future-of-work-amplify", title_zh: "未来工作:AI 不替代,而是放大", title_en: "State of AI in 2026: LLMs, Coding, Scaling Laws, China, Agents, GPUs, AGI | Lex Fridman Podcast #490",
    person_slug: "lex-fridman", duration_sec: 15913, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "EV7WhVT270Q" },
  { slug: "constitutional-ai-explained", title_zh: "Constitutional AI 是什么", title_en: "Constitutional AI - Daniela Amodei (Anthropic",
    person_slug: "dario-amodei", duration_sec: 342, topic_slugs: ["ai"], platform: "youtube", platform_id: "Tjsox6vfsos" },
  { slug: "anthropic-business-logic", title_zh: "Anthropic 的商业逻辑", title_en: "Anthropic CEO warns that without guardrails, AI could be on dangerous path",
    person_slug: "dario-amodei", duration_sec: 832, topic_slugs: ["startup"], platform: "youtube", platform_id: "aAPpQC-3EyE" },
  { slug: "why-rlhf-not-enough", title_zh: "为什么 RLHF 不够", title_en: "Why RLHF is not enough",
    person_slug: "dario-amodei", duration_sec: 2460, topic_slugs: ["ai"], platform: "youtube", platform_id: "da004" },
  { slug: "sam-agent-commercialization", title_zh: "Sam Altman 谈 agent 商业化", title_en: "OpenAI’s Sam Altman Talks ChatGPT, AI Agents and Superintelligence — Live at TED2025",
    person_slug: "sam-altman", duration_sec: 2850, topic_slugs: ["ai", "ai-agent"], platform: "youtube", platform_id: "5MWT_doo68k" },
  { slug: "multi-agent-engineering", title_zh: "Multi-agent 系统的真实工程挑战", title_en: "Andrej Karpathy: From Vibe Coding to Agentic Engineering",
    person_slug: "andrej-karpathy", duration_sec: 1789, topic_slugs: ["ai-agent"], platform: "youtube", platform_id: "96jN2OCOfLs" },
  { slug: "demis-game-to-science", title_zh: "Demis:从游戏到科学", title_en: "Using AI to accelerate scientific discovery - Demis Hassabis (Crick Insight Lecture Series)",
    person_slug: "demis-hassabis", duration_sec: 5360, topic_slugs: ["ai"], platform: "youtube", platform_id: "XtJVLOe4cfs" },
  { slug: "naval-happiness-craft", title_zh: "Naval:幸福是一门可练习的手艺", title_en: "Naval: Happiness is a craft you can practice",
    person_slug: "naval-ravikant", duration_sec: 1980, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "nv002" },
  { slug: "jensen-cuda-moat", title_zh: "Jensen:CUDA 是真正的护城河", title_en: "Jensen Huang – Will Nvidia’s moat persist?",
    person_slug: "jensen-huang", duration_sec: 6193, topic_slugs: ["chip"], platform: "youtube", platform_id: "Hrbq66XqtCo" },
  { slug: "marc-software-eating", title_zh: "Marc:软件依然在吃世界", title_en: "When Software Eats the Real (Estate) World",
    person_slug: "marc-andreessen", duration_sec: 1619, topic_slugs: ["startup"], platform: "youtube", platform_id: "IRPH3K1GXj0" },
  { slug: "pg-default-alive", title_zh: "Paul Graham:Default alive vs default dead", title_en: "Paul Graham: Default alive vs default dead",
    person_slug: "paul-graham", duration_sec: 2700, topic_slugs: ["startup"], platform: "youtube", platform_id: "pg002" },
  { slug: "patrick-progress-studies", title_zh: "Patrick Collison 谈进步研究", title_en: "Patrick Collison on progress studies",
    person_slug: "patrick-collison", duration_sec: 4380, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "pc001" },
  { slug: "lex-on-long-form", title_zh: "Lex Fridman 谈长访谈的意义", title_en: "Lex Fridman on why long-form matters",
    person_slug: "lex-fridman", duration_sec: 3120, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "lf002" },
  { slug: "agent-tools-memory", title_zh: "工具 + 记忆:Agent 的两条腿", title_en: "Deep Dive into LLMs like ChatGPT",
    person_slug: "andrej-karpathy", duration_sec: 12684, topic_slugs: ["ai-agent"], platform: "youtube", platform_id: "7xTGNNLPyMI" },
  { slug: "scaling-laws-revisited", title_zh: "Scaling laws 再讨论", title_en: "Scaling laws revisited",
    person_slug: "dario-amodei", duration_sec: 2700, topic_slugs: ["ai"], platform: "youtube", platform_id: "da005" },
  { slug: "stripe-internet-infra", title_zh: "Patrick:互联网基础设施还远未完成", title_en: "Patrick: internet infra is far from done",
    person_slug: "patrick-collison", duration_sec: 3600, topic_slugs: ["startup"], platform: "youtube", platform_id: "pc002" },
  { slug: "sam-energy-bottleneck", title_zh: "Sam Altman 谈能源瓶颈", title_en: "Sam Altman on the energy bottleneck",
    person_slug: "sam-altman", duration_sec: 2580, topic_slugs: ["chip"], platform: "youtube", platform_id: "sa003" },
  { slug: "jensen-physics-of-ai", title_zh: "Jensen:AI 的物理学", title_en: "Jensen: the physics of AI",
    person_slug: "jensen-huang", duration_sec: 3540, topic_slugs: ["chip", "ai"], platform: "youtube", platform_id: "jh003" },
  { slug: "naval-judgement-vs-effort", title_zh: "Naval:判断力 > 努力", title_en: "Naval: judgement > effort",
    person_slug: "naval-ravikant", duration_sec: 1800, topic_slugs: ["startup"], platform: "youtube", platform_id: "nv003" },
  { slug: "demis-protein-folding-frontier", title_zh: "Demis:蛋白质折叠的下一站", title_en: "Protein folding explained",
    person_slug: "demis-hassabis", duration_sec: 112, topic_slugs: ["ai"], platform: "youtube", platform_id: "KpedmJdrTpY" },
  { slug: "marc-techno-optimism", title_zh: "Marc:技术乐观主义宣言", title_en: "Marc Andreessen on his Techno-Optimist Manifesto",
    person_slug: "marc-andreessen", duration_sec: 97, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "7xwQMUDRAtA" },
  { slug: "pg-essays-rewatched", title_zh: "Paul Graham 经典随笔回看", title_en: "Re-reading Paul Graham's essays",
    person_slug: "paul-graham", duration_sec: 2280, topic_slugs: ["startup"], platform: "youtube", platform_id: "pg003" },
  { slug: "lex-on-curiosity", title_zh: "Lex:好奇心是不变量", title_en: "Lex: curiosity is the invariant",
    person_slug: "lex-fridman", duration_sec: 2700, topic_slugs: ["future-of-work"], platform: "youtube", platform_id: "lf003" },
];

const peopleByslug = Object.fromEntries(peopleSeed.map((p) => [p.slug, p]));

export const videoCards: VideoCard[] = videoSeeds.map((v) => ({
  slug: v.slug,
  title_zh: v.title_zh,
  title_en: v.title_en,
  cover_url: `https://i.ytimg.com/vi/${v.platform_id}/maxresdefault.jpg`,
  person: personRef(peopleByslug[v.person_slug]),
  duration_sec: v.duration_sec,
  topics: v.topic_slugs.map((s) => topicMap[s]),
  one_liner_zh: v.one_liner_zh,
  one_liner_en: v.one_liner_en,
}));

export const videoDetails: VideoDetail[] = videoSeeds.map((v, i) => ({
  ...videoCards[i],
  platform: v.platform,
  platform_id: v.platform_id,
  published_at: new Date(Date.UTC(2026, 3, 12 - i)).toISOString(),
  ai_status: i === videoSeeds.length - 1 ? "pending" : "ai_done",
  ai: i === videoSeeds.length - 1 ? null : fullAI(i + 1),
}));

export const people: PersonDetail[] = peopleSeed.map((p) => {
  const personVideos = videoCards.filter((v) => v.person.slug === p.slug);
  return {
    slug: p.slug,
    name_zh: p.name_zh,
    name_en: p.name_en,
    title_zh: p.title_zh,
    title_en: p.title_en,
    avatar_url: `/avatars/${p.slug}.jpg`,
    bio_zh: p.bio_zh,
    bio_en: p.bio_en,
    signature_views_zh: personVideos.slice(0, 3).map((v) => ({
      quote: v.one_liner_zh ?? `${p.name_zh} 在《${v.title_zh}》中表达的关键观点。`,
      from_video_slug: v.slug,
      from_video_title: v.title_zh,
    })),
    signature_views_en: personVideos.slice(0, 3).map((v) => ({
      quote: v.one_liner_en ?? `Key view by ${p.name_en} from "${v.title_en}".`,
      from_video_slug: v.slug,
      from_video_title: v.title_en,
    })),
    videos: personVideos,
  };
});

export const topicDetails: TopicDetail[] = topics.map((t) => {
  const topicVideos = videoCards.filter((v) => v.topics.some((tx) => tx.slug === t.slug));
  const relatedPeople = Array.from(new Set(topicVideos.map((v) => v.person.slug)))
    .map((slug) => people.find((p) => p.slug === slug)!)
    .filter(Boolean)
    .map((p) => ({ slug: p.slug, name_zh: p.name_zh, name_en: p.name_en, avatar_url: p.avatar_url }));
  return {
    slug: t.slug,
    name_zh: t.name_zh,
    name_en: t.name_en,
    intro_zh: `关于 ${t.name_zh} 的精选视频与关键嘉宾。`,
    intro_en: `Curated videos and key guests about ${t.name_en}.`,
    videos: topicVideos,
    related_people: relatedPeople,
  };
});

// ---------- SEARCH ----------
export function searchMock(q: string, mode: "keyword" | "semantic"): SearchResults {
  const needle = q.trim().toLowerCase();
  const match = (s: string) => s.toLowerCase().includes(needle);
  const videos = !needle
    ? []
    : videoCards.filter(
        (v) => match(v.title_zh) || match(v.title_en) || (v.one_liner_zh && match(v.one_liner_zh)) || (v.one_liner_en && match(v.one_liner_en)),
      );
  const ppl = !needle
    ? []
    : people.filter((p) => match(p.name_zh) || match(p.name_en) || match(p.bio_zh) || match(p.bio_en));
  const tps = !needle ? [] : topicDetails.filter((t) => match(t.name_zh) || match(t.name_en) || match(t.intro_zh));
  return {
    query: q,
    mode,
    videos: videos.slice(0, 20),
    people: ppl.map((p) => ({ slug: p.slug, name_zh: p.name_zh, name_en: p.name_en, avatar_url: p.avatar_url, bio_zh: p.bio_zh, bio_en: p.bio_en })),
    topics: tps.map((t) => ({ slug: t.slug, name_zh: t.name_zh, name_en: t.name_en, intro_zh: t.intro_zh, intro_en: t.intro_en })),
  };
}

// ---------- HERO PICK ----------
export const heroVideo = videoDetails[0];

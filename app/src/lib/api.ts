// API wrapper. Reads from Neon Postgres when DATABASE_URL is configured,
// otherwise falls back to static mock data (graceful degradation for local
// dev / preview without a DB). Phase D round-011 · 大刘/老吴.
// round-013: 占位/草稿内容(is_draft)对外统一隐藏 —— 列表只展示有真实视频
// 与 AI 速读的内容,draft 详情页直链 → 404。单一出口过滤,DB / mock 双路径覆盖。
import {
  videoCards,
  videoDetails,
  people,
  topicDetails,
  topics,
  searchMock,
  heroVideo,
} from "./mock-data";
import type {
  VideoCard,
  VideoDetail,
  PersonDetail,
  TopicDetail,
  SearchResults,
  Topic,
} from "./types";

// Use the real DB only when a connection string is present AND mock isn't forced.
function useDb(): boolean {
  return (
    !!process.env.DATABASE_URL &&
    (process.env.USE_MOCK_API ?? "").toLowerCase() !== "true"
  );
}

// 占位内容(无真实视频与 AI 速读)不对外展示。
const isLive = (v: VideoCard): boolean => !v.is_draft;

export async function getLatestVideos(): Promise<VideoCard[]> {
  const list = useDb()
    ? await (await import("./db-api")).dbGetLatestVideos()
    : videoCards;
  return list.filter(isLive);
}

export async function getHero(): Promise<VideoDetail> {
  if (useDb()) {
    const hero = await (await import("./db-api")).dbGetHero();
    if (hero) return hero;
  }
  // mock fallback: 取第一个非占位的视频作 hero。
  return videoDetails.find(isLive) ?? heroVideo;
}

export async function getTopics(): Promise<Topic[]> {
  if (useDb()) return (await import("./db-api")).dbGetTopics();
  return topics;
}

export async function getVideo(slug: string): Promise<VideoDetail | null> {
  const v = useDb()
    ? await (await import("./db-api")).dbGetVideo(slug)
    : videoDetails.find((x) => x.slug === slug) ?? null;
  // 占位内容详情页不可达(直链 → 404)。
  if (!v || v.is_draft) return null;
  return v;
}

export async function getPerson(slug: string): Promise<PersonDetail | null> {
  const p = useDb()
    ? await (await import("./db-api")).dbGetPerson(slug)
    : people.find((x) => x.slug === slug) ?? null;
  if (!p) return null;
  return { ...p, videos: p.videos.filter(isLive) };
}

export async function getAllPeople(): Promise<PersonDetail[]> {
  const list = useDb()
    ? await (await import("./db-api")).dbGetAllPeople()
    : people;
  return list.map((p) => ({ ...p, videos: p.videos.filter(isLive) }));
}

export async function getTopic(slug: string): Promise<TopicDetail | null> {
  const t = useDb()
    ? await (await import("./db-api")).dbGetTopic(slug)
    : topicDetails.find((x) => x.slug === slug) ?? null;
  if (!t) return null;
  return { ...t, videos: t.videos.filter(isLive) };
}

export async function search(
  q: string,
  mode: "keyword" | "semantic" = "keyword",
): Promise<SearchResults> {
  const r = useDb()
    ? await (await import("./db-api")).dbSearch(q, mode)
    : searchMock(q, mode);
  return { ...r, videos: r.videos.filter(isLive) };
}

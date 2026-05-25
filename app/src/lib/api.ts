// API wrapper. Reads from Neon Postgres when DATABASE_URL is configured,
// otherwise falls back to static mock data (graceful degradation for local
// dev / preview without a DB). Phase D round-011 · 大刘/老吴.
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

export async function getLatestVideos(): Promise<VideoCard[]> {
  if (useDb()) return (await import("./db-api")).dbGetLatestVideos();
  return videoCards;
}

export async function getHero(): Promise<VideoDetail> {
  if (useDb()) {
    const hero = await (await import("./db-api")).dbGetHero();
    if (hero) return hero;
  }
  return heroVideo;
}

export async function getTopics(): Promise<Topic[]> {
  if (useDb()) return (await import("./db-api")).dbGetTopics();
  return topics;
}

export async function getVideo(slug: string): Promise<VideoDetail | null> {
  if (useDb()) return (await import("./db-api")).dbGetVideo(slug);
  return videoDetails.find((v) => v.slug === slug) ?? null;
}

export async function getPerson(slug: string): Promise<PersonDetail | null> {
  if (useDb()) return (await import("./db-api")).dbGetPerson(slug);
  return people.find((p) => p.slug === slug) ?? null;
}

export async function getAllPeople(): Promise<PersonDetail[]> {
  if (useDb()) return (await import("./db-api")).dbGetAllPeople();
  return people;
}

export async function getTopic(slug: string): Promise<TopicDetail | null> {
  if (useDb()) return (await import("./db-api")).dbGetTopic(slug);
  return topicDetails.find((t) => t.slug === slug) ?? null;
}

export async function search(
  q: string,
  mode: "keyword" | "semantic" = "keyword",
): Promise<SearchResults> {
  if (useDb()) return (await import("./db-api")).dbSearch(q, mode);
  return searchMock(q, mode);
}

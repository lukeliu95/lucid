// DB-backed data source (Phase D round-011 · 大刘/老吴).
// Mirrors the mock api.ts surface but reads from Neon Postgres via Drizzle.
// Only invoked when DATABASE_URL is set (see api.ts switch).
import "server-only";
import { db } from "@/db/client";
import type {
  VideoCard,
  VideoDetail,
  PersonDetail,
  TopicDetail,
  SearchResults,
  Topic,
  VideoAI,
  KeyPoint,
  TimelineItem,
  SignatureView,
} from "./types";

const VALID_YT_ID = /^[A-Za-z0-9_-]{11}$/;
const isDraft = (pid: string) => !VALID_YT_ID.test(pid) || pid === "abcdEF12345";

const videoWith = {
  person: true,
  ai: true,
  topics: { with: { topic: true } },
} as const;

type TopicRow = { slug: string; name_zh: string; name_en: string };
type PersonRow = {
  slug: string;
  name_zh: string;
  name_en: string;
  title_zh: string | null;
  title_en: string | null;
  avatar_url: string | null;
  bio_zh: string | null;
  bio_en: string | null;
  signature_views_zh: SignatureView[];
  signature_views_en: SignatureView[];
};
type AiRow = {
  summary_zh: string | null;
  summary_en: string | null;
  keypoints_zh: KeyPoint[];
  keypoints_en: KeyPoint[];
  timeline_zh: TimelineItem[];
  timeline_en: TimelineItem[];
  explainer_quick_zh: string | null;
  explainer_quick_en: string | null;
  explainer_deep_zh: string | null;
  explainer_deep_en: string | null;
};
type VideoRow = {
  slug: string;
  title_zh: string;
  title_en: string;
  cover_url: string | null;
  platform: string;
  platform_id: string;
  duration_sec: number;
  published_at: Date | null;
  ai_status: string;
  person: PersonRow;
  topics: { topic: TopicRow }[];
  ai: AiRow | null;
};

function toCard(v: VideoRow): VideoCard {
  return {
    slug: v.slug,
    title_zh: v.title_zh,
    title_en: v.title_en,
    cover_url: v.cover_url ?? "",
    person: { slug: v.person.slug, name_zh: v.person.name_zh, name_en: v.person.name_en },
    duration_sec: v.duration_sec,
    topics: v.topics.map((t) => ({
      slug: t.topic.slug,
      name_zh: t.topic.name_zh,
      name_en: t.topic.name_en,
    })),
    is_draft: isDraft(v.platform_id),
  };
}

function toAi(ai: AiRow | null): VideoAI | null {
  if (!ai) return null;
  return {
    summary_zh: ai.summary_zh ?? "",
    summary_en: ai.summary_en ?? "",
    keypoints_zh: ai.keypoints_zh ?? [],
    keypoints_en: ai.keypoints_en ?? [],
    timeline_zh: ai.timeline_zh ?? [],
    timeline_en: ai.timeline_en ?? [],
    explainer_quick_zh: ai.explainer_quick_zh ?? "",
    explainer_quick_en: ai.explainer_quick_en ?? "",
    explainer_deep_zh: ai.explainer_deep_zh ?? "",
    explainer_deep_en: ai.explainer_deep_en ?? "",
  };
}

function toDetail(v: VideoRow): VideoDetail {
  return {
    ...toCard(v),
    platform: v.platform === "bilibili" ? "bilibili" : "youtube",
    platform_id: v.platform_id,
    published_at: v.published_at ? new Date(v.published_at).toISOString() : "",
    ai_status: (v.ai_status as VideoDetail["ai_status"]) ?? "pending",
    ai: toAi(v.ai),
  };
}

export async function dbGetLatestVideos(): Promise<VideoCard[]> {
  const rows = (await db.query.videos.findMany({
    with: videoWith,
    orderBy: (v, { desc: d }) => [d(v.published_at), d(v.created_at)],
  })) as unknown as VideoRow[];
  return rows.map(toCard);
}

export async function dbGetHero(): Promise<VideoDetail | null> {
  const rows = (await db.query.videos.findMany({ with: videoWith })) as unknown as VideoRow[];
  // hero = first real (non-draft) video, else first
  const hero = rows.find((v) => !isDraft(v.platform_id)) ?? rows[0];
  return hero ? toDetail(hero) : null;
}

export async function dbGetTopics(): Promise<Topic[]> {
  const rows = (await db.query.topics.findMany({
    orderBy: (t, { asc: a }) => [a(t.sort_order)],
  })) as unknown as TopicRow[];
  return rows.map((t) => ({ slug: t.slug, name_zh: t.name_zh, name_en: t.name_en }));
}

export async function dbGetVideo(slug: string): Promise<VideoDetail | null> {
  const v = (await db.query.videos.findFirst({
    where: (vv, { eq: e }) => e(vv.slug, slug),
    with: videoWith,
  })) as unknown as VideoRow | undefined;
  return v ? toDetail(v) : null;
}

export async function dbGetPerson(slug: string): Promise<PersonDetail | null> {
  const p = (await db.query.people.findFirst({
    where: (pp, { eq: e }) => e(pp.slug, slug),
    with: { videos: { with: videoWith } },
  })) as unknown as (PersonRow & { videos: VideoRow[] }) | undefined;
  if (!p) return null;
  return {
    slug: p.slug,
    name_zh: p.name_zh,
    name_en: p.name_en,
    title_zh: p.title_zh ?? "",
    title_en: p.title_en ?? "",
    avatar_url: p.avatar_url ?? "",
    bio_zh: p.bio_zh ?? "",
    bio_en: p.bio_en ?? "",
    signature_views_zh: p.signature_views_zh ?? [],
    signature_views_en: p.signature_views_en ?? [],
    videos: p.videos.map(toCard),
  };
}

export async function dbGetAllPeople(): Promise<PersonDetail[]> {
  const rows = (await db.query.people.findMany({
    with: { videos: { with: videoWith } },
  })) as unknown as (PersonRow & { videos: VideoRow[] })[];
  return rows.map((p) => ({
    slug: p.slug,
    name_zh: p.name_zh,
    name_en: p.name_en,
    title_zh: p.title_zh ?? "",
    title_en: p.title_en ?? "",
    avatar_url: p.avatar_url ?? "",
    bio_zh: p.bio_zh ?? "",
    bio_en: p.bio_en ?? "",
    signature_views_zh: p.signature_views_zh ?? [],
    signature_views_en: p.signature_views_en ?? [],
    videos: p.videos.map(toCard),
  }));
}

export async function dbGetTopic(slug: string): Promise<TopicDetail | null> {
  const t = (await db.query.topics.findFirst({
    where: (tt, { eq: e }) => e(tt.slug, slug),
    with: { videos: { with: { video: { with: videoWith } } } },
  })) as unknown as
    | {
        slug: string;
        name_zh: string;
        name_en: string;
        intro_zh: string | null;
        intro_en: string | null;
        videos: { video: VideoRow }[];
      }
    | undefined;
  if (!t) return null;
  const videos = t.videos.map((vt) => vt.video);
  const seen = new Set<string>();
  const related_people = videos
    .map((v) => v.person)
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .map((p) => ({
      slug: p.slug,
      name_zh: p.name_zh,
      name_en: p.name_en,
      avatar_url: p.avatar_url ?? "",
    }));
  return {
    slug: t.slug,
    name_zh: t.name_zh,
    name_en: t.name_en,
    intro_zh: t.intro_zh ?? "",
    intro_en: t.intro_en ?? "",
    videos: videos.map(toCard),
    related_people,
  };
}

export async function dbSearch(
  q: string,
  mode: "keyword" | "semantic" = "keyword",
): Promise<SearchResults> {
  const needle = q.trim().toLowerCase();
  const [vids, ppl, tps] = await Promise.all([
    db.query.videos.findMany({ with: videoWith }) as unknown as Promise<VideoRow[]>,
    db.query.people.findMany() as unknown as Promise<PersonRow[]>,
    db.query.topics.findMany() as unknown as Promise<TopicRow[]>,
  ]);
  const match = (...vals: (string | null | undefined)[]) =>
    !needle || vals.some((v) => (v ?? "").toLowerCase().includes(needle));
  return {
    query: q,
    mode,
    videos: vids
      .filter((v) => match(v.title_zh, v.title_en, v.person.name_zh, v.person.name_en))
      .map(toCard),
    people: ppl
      .filter((p) => match(p.name_zh, p.name_en, p.bio_zh, p.bio_en))
      .map((p) => ({
        slug: p.slug,
        name_zh: p.name_zh,
        name_en: p.name_en,
        avatar_url: p.avatar_url ?? "",
        bio_zh: p.bio_zh ?? "",
        bio_en: p.bio_en ?? "",
      })),
    topics: tps
      .filter((t) => match(t.name_zh, t.name_en))
      .map((t) => ({
        slug: t.slug,
        name_zh: t.name_zh,
        name_en: t.name_en,
        intro_zh: "",
        intro_en: "",
      })),
  };
}

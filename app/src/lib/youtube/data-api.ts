/**
 * YouTube Data API v3 — thin server-only wrapper.
 *
 * - 0 明文 key 进 src/。仅读 process.env.YOUTUBE_API_KEY。
 * - 不依赖 googleapis npm 包,直接 fetch。
 * - 401/403/404 → null;quota exceeded / 500 → throw Error。
 * - 每次调用打印 quota 估算:`[youtube-api] used N units`。
 *
 * Quota cost reference (v3):
 *   videos.list     →  1 unit per call
 *   channels.list   →  1 unit per call
 *   search.list     →  100 units per call
 *   (per https://developers.google.com/youtube/v3/determine_quota_cost)
 *
 * Note: this module is intended for server-only contexts (route handlers, RSC,
 * CLI scripts). We deliberately do NOT `import "server-only"` so that
 * `tsx src/scripts/*.ts` can import it under plain Node. The API key is only
 * read from `process.env.YOUTUBE_API_KEY` and is never shipped to a client
 * bundle as long as you don't import this from a Client Component.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";

let quotaUsedThisProcess = 0;
function trackQuota(units: number, op: string): void {
  quotaUsedThisProcess += units;
  // eslint-disable-next-line no-console
  console.log(`[youtube-api] used ${units} units (${op}) · cumulative=${quotaUsedThisProcess}`);
}

export function getQuotaUsedThisProcess(): number {
  return quotaUsedThisProcess;
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("[youtube-api] YOUTUBE_API_KEY is not set in env");
  }
  return key;
}

// ---------- Types ----------

export type ThumbnailVariant = {
  url: string;
  width: number;
  height: number;
};

export type VideoThumbnails = {
  default: ThumbnailVariant | null;
  medium: ThumbnailVariant | null;
  high: ThumbnailVariant | null;
  standard: ThumbnailVariant | null;
  maxres: ThumbnailVariant | null;
};

export type ChannelThumbnails = {
  default: ThumbnailVariant | null;
  medium: ThumbnailVariant | null;
  high: ThumbnailVariant | null;
};

export type VideoMetadata = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  durationSec: number;
  thumbnails: VideoThumbnails;
  tags: string[];
};

export type ChannelMetadata = {
  id: string;
  title: string;
  description: string;
  thumbnails: ChannelThumbnails;
  customUrl?: string;
};

export type SearchResultItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: ChannelThumbnails;
};

export type SearchOpts = {
  maxResults?: number;
  type?: "video" | "channel";
  order?: "relevance" | "date" | "viewCount";
};

// ---------- Internal: raw API shapes (only what we use) ----------

interface RawThumbnail { url: string; width: number; height: number }

interface RawVideoItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    tags?: string[];
    thumbnails?: Record<string, RawThumbnail | undefined>;
  };
  contentDetails?: {
    duration?: string;
  };
}

interface RawChannelItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    thumbnails?: Record<string, RawThumbnail | undefined>;
  };
}

interface RawSearchItem {
  id?: { videoId?: string; channelId?: string; kind?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, RawThumbnail | undefined>;
  };
}

interface RawErrorBody {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string; domain?: string }>;
  };
}

// ---------- Helpers ----------

function parseThumb(raw: RawThumbnail | undefined): ThumbnailVariant | null {
  if (!raw || !raw.url) return null;
  return { url: raw.url, width: raw.width ?? 0, height: raw.height ?? 0 };
}

function parseVideoThumbnails(t: Record<string, RawThumbnail | undefined> | undefined): VideoThumbnails {
  return {
    default: parseThumb(t?.default),
    medium: parseThumb(t?.medium),
    high: parseThumb(t?.high),
    standard: parseThumb(t?.standard),
    maxres: parseThumb(t?.maxres),
  };
}

function parseChannelThumbnails(t: Record<string, RawThumbnail | undefined> | undefined): ChannelThumbnails {
  return {
    default: parseThumb(t?.default),
    medium: parseThumb(t?.medium),
    high: parseThumb(t?.high),
  };
}

/** ISO-8601 duration (e.g. PT1H23M45S) → seconds. Returns 0 on parse failure. */
export function isoDurationToSec(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const mi = m[2] ? parseInt(m[2], 10) : 0;
  const s = m[3] ? parseInt(m[3], 10) : 0;
  return h * 3600 + mi * 60 + s;
}

/** Accepts youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, or a raw 11-char ID. */
export function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns: RegExp[] = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Build a CDN thumbnail URL without spending API quota. */
export function thumbnailUrl(
  videoId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "maxres",
): string {
  const fileMap: Record<string, string> = {
    default: "default.jpg",
    medium: "mqdefault.jpg",
    high: "hqdefault.jpg",
    standard: "sddefault.jpg",
    maxres: "maxresdefault.jpg",
  };
  return `https://i.ytimg.com/vi/${videoId}/${fileMap[quality]}`;
}

async function ytFetch<T>(path: string, params: Record<string, string>, costUnits: number, op: string): Promise<T | null> {
  const key = getApiKey();
  const usp = new URLSearchParams({ ...params, key });
  const url = `${API_BASE}${path}?${usp.toString()}`;
  trackQuota(costUnits, op);
  const res = await fetch(url, { method: "GET" });
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    let body: RawErrorBody = {};
    try {
      body = (await res.json()) as RawErrorBody;
    } catch {
      // ignore
    }
    const reason = body.error?.errors?.[0]?.reason ?? "";
    // quota exhaustion → throw so callers can stop the run
    if (reason === "quotaExceeded" || reason === "rateLimitExceeded") {
      throw new Error(`[youtube-api] quota exceeded (cumulative=${quotaUsedThisProcess} units): ${body.error?.message ?? ""}`);
    }
    // not-found / forbidden (private/deleted) → null
    // eslint-disable-next-line no-console
    console.warn(`[youtube-api] ${op} → ${res.status} ${reason || body.error?.message || ""}`);
    return null;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[youtube-api] ${op} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ---------- Public API ----------

interface RawVideosListResponse { items?: RawVideoItem[] }
interface RawChannelsListResponse { items?: RawChannelItem[] }
interface RawSearchListResponse { items?: RawSearchItem[] }

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  const id = extractVideoId(videoId) ?? videoId;
  const data = await ytFetch<RawVideosListResponse>(
    "/videos",
    { part: "snippet,contentDetails", id },
    1,
    `videos.list(${id})`,
  );
  if (!data) return null;
  const item = data.items?.[0];
  if (!item) return null;
  const snippet = item.snippet ?? {};
  return {
    id: item.id,
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    channelId: snippet.channelId ?? "",
    channelTitle: snippet.channelTitle ?? "",
    publishedAt: snippet.publishedAt ?? "",
    durationSec: isoDurationToSec(item.contentDetails?.duration ?? ""),
    thumbnails: parseVideoThumbnails(snippet.thumbnails),
    tags: snippet.tags ?? [],
  };
}

export async function fetchChannelMetadata(channelId: string): Promise<ChannelMetadata | null> {
  const data = await ytFetch<RawChannelsListResponse>(
    "/channels",
    { part: "snippet", id: channelId },
    1,
    `channels.list(${channelId})`,
  );
  if (!data) return null;
  const item = data.items?.[0];
  if (!item) return null;
  const snippet = item.snippet ?? {};
  return {
    id: item.id,
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    thumbnails: parseChannelThumbnails(snippet.thumbnails),
    customUrl: snippet.customUrl,
  };
}

export async function searchVideos(query: string, opts: SearchOpts = {}): Promise<SearchResultItem[]> {
  const maxResults = String(opts.maxResults ?? 5);
  const type = opts.type ?? "video";
  const order = opts.order ?? "relevance";
  const data = await ytFetch<RawSearchListResponse>(
    "/search",
    { part: "snippet", q: query, maxResults, type, order },
    100,
    `search.list(${query.slice(0, 40)})`,
  );
  if (!data?.items) return [];
  const out: SearchResultItem[] = [];
  for (const item of data.items) {
    const videoId = item.id?.videoId ?? item.id?.channelId ?? "";
    if (!videoId) continue;
    const sn = item.snippet ?? {};
    out.push({
      videoId,
      title: sn.title ?? "",
      channelTitle: sn.channelTitle ?? "",
      publishedAt: sn.publishedAt ?? "",
      thumbnails: parseChannelThumbnails(sn.thumbnails),
    });
  }
  return out;
}

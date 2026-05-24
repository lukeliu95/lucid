// API contract types · mirrors docs/design/handoff-to-engineering.md §3

export type Locale = "zh" | "en";

export type Topic = {
  slug: string;
  name_zh: string;
  name_en: string;
};

export type PersonRef = {
  slug: string;
  name_zh: string;
  name_en: string;
};

export type VideoCard = {
  slug: string;
  title_zh: string;
  title_en: string;
  cover_url: string;
  person: PersonRef;
  duration_sec: number;
  topics: Topic[];
  one_liner_zh?: string;
  one_liner_en?: string;
  /** true when the underlying video is still a placeholder (no real platform_id yet). */
  is_draft?: boolean;
};

export type AIStatus = "pending" | "asr_done" | "ai_done" | "failed";

export type KeyPoint = {
  text: string;
  timestamp_sec?: number;
  source_span?: string;
};

export type TimelineItem = {
  timestamp_sec: number;
  title: string;
  one_liner: string;
};

export type VideoAI = {
  summary_zh: string;
  summary_en: string;
  keypoints_zh: KeyPoint[];
  keypoints_en: KeyPoint[];
  timeline_zh: TimelineItem[];
  timeline_en: TimelineItem[];
  explainer_quick_zh: string;
  explainer_quick_en: string;
  explainer_deep_zh: string;
  explainer_deep_en: string;
};

export type VideoDetail = VideoCard & {
  platform: "youtube" | "bilibili";
  platform_id: string;
  published_at: string;
  ai_status: AIStatus;
  ai: VideoAI | null;
};

export type SignatureView = {
  quote: string;
  from_video_slug: string;
  from_video_title: string;
};

export type PersonDetail = {
  slug: string;
  name_zh: string;
  name_en: string;
  title_zh: string;
  title_en: string;
  avatar_url: string;
  bio_zh: string;
  bio_en: string;
  signature_views_zh: SignatureView[];
  signature_views_en: SignatureView[];
  videos: VideoCard[];
};

export type TopicDetail = {
  slug: string;
  name_zh: string;
  name_en: string;
  intro_zh: string;
  intro_en: string;
  videos: VideoCard[];
  related_people: Array<Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url">>;
};

export type SearchResults = {
  query: string;
  mode: "keyword" | "semantic";
  videos: VideoCard[];
  people: Array<Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url" | "bio_zh" | "bio_en">>;
  topics: Array<Pick<TopicDetail, "slug" | "name_zh" | "name_en" | "intro_zh" | "intro_en">>;
};

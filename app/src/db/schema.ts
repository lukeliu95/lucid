/**
 * Drizzle schema · kdsj-world
 * Canonical. See docs/02-generate/db-schema.md for narrative.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// pgvector custom type · stored as text (vector literal) on insert,
// Postgres parses; for select we treat as string and parse client-side
// when needed. drizzle-orm has no native pgvector helper as of writing,
// so we emit `vector(1536)` via a custom type.
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    // value comes back as "[0.1,0.2,...]"
    return JSON.parse(value as unknown as string) as number[];
  },
});

// -- topics ------------------------------------------------------------
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name_zh: text("name_zh").notNull(),
  name_en: text("name_en").notNull(),
  intro_zh: text("intro_zh"),
  intro_en: text("intro_en"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUq: uniqueIndex("topics_slug_uq").on(t.slug),
}));

// -- people ------------------------------------------------------------
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name_zh: text("name_zh").notNull(),
  name_en: text("name_en").notNull(),
  title_zh: text("title_zh"),
  title_en: text("title_en"),
  avatar_url: text("avatar_url"),
  bio_zh: text("bio_zh"),
  bio_en: text("bio_en"),
  signature_views_zh: jsonb("signature_views_zh").$type<SignatureView[]>().notNull().default([]),
  signature_views_en: jsonb("signature_views_en").$type<SignatureView[]>().notNull().default([]),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUq: uniqueIndex("people_slug_uq").on(t.slug),
}));

export type SignatureView = {
  quote: string;
  from_video_slug: string;
  from_video_title: string;
};

// -- videos ------------------------------------------------------------
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  platform: text("platform").notNull(),  // 'youtube' | 'bilibili'
  platform_id: text("platform_id").notNull(),
  url: text("url").notNull(),
  cover_url: text("cover_url"),
  title_zh: text("title_zh").notNull(),
  title_en: text("title_en").notNull(),
  person_id: integer("person_id").notNull().references(() => people.id),
  duration_sec: integer("duration_sec").notNull().default(0),
  published_at: timestamp("published_at", { withTimezone: true }),
  ai_status: text("ai_status").notNull().default("pending"),  // pending | asr_done | ai_done | failed
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUq: uniqueIndex("videos_slug_uq").on(t.slug),
  platformUq: uniqueIndex("videos_platform_uq").on(t.platform, t.platform_id),
  personIdx: index("videos_person_idx").on(t.person_id),
  statusIdx: index("videos_status_idx").on(t.ai_status),
}));

// -- videos_topics (M:N) ----------------------------------------------
export const videos_topics = pgTable("videos_topics", {
  video_id: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  topic_id: integer("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.video_id, t.topic_id] }),
}));

// -- videos_ai (1:1) ---------------------------------------------------
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

export const videos_ai = pgTable("videos_ai", {
  video_id: integer("video_id")
    .primaryKey()
    .references(() => videos.id, { onDelete: "cascade" }),
  summary_zh: text("summary_zh"),
  summary_en: text("summary_en"),
  keypoints_zh: jsonb("keypoints_zh").$type<KeyPoint[]>().notNull().default([]),
  keypoints_en: jsonb("keypoints_en").$type<KeyPoint[]>().notNull().default([]),
  timeline_zh: jsonb("timeline_zh").$type<TimelineItem[]>().notNull().default([]),
  timeline_en: jsonb("timeline_en").$type<TimelineItem[]>().notNull().default([]),
  explainer_quick_zh: text("explainer_quick_zh"),
  explainer_quick_en: text("explainer_quick_en"),
  explainer_deep_zh: text("explainer_deep_zh"),
  explainer_deep_en: text("explainer_deep_en"),
  model: text("model"),
  generated_at: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -- video_embeddings --------------------------------------------------
export const video_embeddings = pgTable("video_embeddings", {
  video_id: integer("video_id")
    .primaryKey()
    .references(() => videos.id, { onDelete: "cascade" }),
  embedding: vector("embedding").notNull(),
  input_text: text("input_text"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -- favorites ---------------------------------------------------------
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),       // Clerk userId
  video_id: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userVideoUq: uniqueIndex("favorites_user_video_uq").on(t.user_id, t.video_id),
  userIdx: index("favorites_user_idx").on(t.user_id, t.created_at),
}));

// -- pipeline_runs (S9 state machine) ----------------------------------
export const pipeline_runs = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  video_id: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  step: text("step").notNull(),       // fetch_subtitle | whisper_asr | s1_summary | ...
  status: text("status").notNull(),   // running | done | failed
  attempts: integer("attempts").notNull().default(0),
  error_message: text("error_message"),
  started_at: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finished_at: timestamp("finished_at", { withTimezone: true }),
}, (t) => ({
  videoStepIdx: index("pipeline_runs_video_step_idx").on(t.video_id, t.step),
}));

// -- relations (drizzle relational queries) ----------------------------
export const peopleRelations = relations(people, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  person: one(people, { fields: [videos.person_id], references: [people.id] }),
  ai: one(videos_ai, { fields: [videos.id], references: [videos_ai.video_id] }),
  embedding: one(video_embeddings, { fields: [videos.id], references: [video_embeddings.video_id] }),
  topics: many(videos_topics),
  favorites: many(favorites),
}));

export const videosTopicsRelations = relations(videos_topics, ({ one }) => ({
  video: one(videos, { fields: [videos_topics.video_id], references: [videos.id] }),
  topic: one(topics, { fields: [videos_topics.topic_id], references: [topics.id] }),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  videos: many(videos_topics),
}));

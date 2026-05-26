import type { MetadataRoute } from "next";
import { getLatestVideos, getAllPeople, getTopics } from "@/lib/api";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://lucid.simprr.com");

const LOCALES = ["zh", "en"] as const;

// 双语 hreflang alternates(每个路径都给 zh/en 互译声明)。
function alternates(path: string) {
  return {
    languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${path}`])) as Record<string, string>,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [videos, people, topics] = await Promise.all([
    getLatestVideos().catch(() => []),
    getAllPeople().catch(() => []),
    getTopics().catch(() => []),
  ]);

  const now = new Date();
  const out: MetadataRoute.Sitemap = [];
  const staticPaths = ["", "/search"];

  for (const l of LOCALES) {
    for (const p of staticPaths) {
      out.push({ url: `${SITE}/${l}${p}`, lastModified: now, changeFrequency: "daily", priority: p === "" ? 1 : 0.5, alternates: alternates(p) });
    }
    for (const v of videos) {
      out.push({ url: `${SITE}/${l}/videos/${v.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8, alternates: alternates(`/videos/${v.slug}`) });
    }
    for (const pe of people) {
      out.push({ url: `${SITE}/${l}/people/${pe.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: alternates(`/people/${pe.slug}`) });
    }
    for (const t of topics) {
      out.push({ url: `${SITE}/${l}/topics/${t.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6, alternates: alternates(`/topics/${t.slug}`) });
    }
  }
  return out;
}

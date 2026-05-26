import type { MetadataRoute } from "next";
import { getLatestVideos, getAllPeople, getTopics } from "@/lib/api";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://lucid.simprr.com");

const LOCALES = ["zh", "en"] as const;

// sitemap 默认在构建期静态生成 —— 会把"当时"的 DB 内容冻结(实测构建快照只抓到
// 1-2 个视频,而首页运行时动态渲染拿到全量 34)。内容持续入库,故强制动态:
// 每次请求打实时 DB,和首页一致。sitemap 访问低频,运行时渲染成本可忽略。
export const dynamic = "force-dynamic";

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
  const staticPaths = ["", "/search", "/changelog"];

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

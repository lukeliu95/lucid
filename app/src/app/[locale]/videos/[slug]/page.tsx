import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getVideo, getPerson, getLatestVideos } from "@/lib/api";
import { Player } from "@/components/video/player";
import { TimelineNav } from "@/components/video/timeline-nav";
import { SeekProvider } from "@/components/video/seek-context";
import { FavoriteButton } from "@/components/video/favorite-button";
import { RecordView } from "@/components/video/record-view";
import { VideoGrid } from "@/components/video/video-grid";
import { AIPendingBanner } from "@/components/shared/ai-pending-banner";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/types";
import { formatDuration, localized } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const video = await getVideo(slug);
  if (!video) return {};
  const title = localized(video, "title", locale);
  const summary = video.ai ? localized(video.ai, "summary", locale) : "";
  const personName = localized(video.person, "name", locale);
  const desc = (summary || `${personName} · ${localized(video, "title", locale)} · 中文速读`).slice(0, 155);
  const path = `/videos/${slug}`;
  return {
    title: `${title} · 明读`,
    description: desc,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { zh: `/zh${path}`, en: `/en${path}` },
    },
    openGraph: {
      title,
      description: desc,
      type: "article",
      // og:image 由同目录 opengraph-image.tsx 自动生成(品牌金句卡)
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const t = await getTranslations();
  const video = await getVideo(slug);
  if (!video) notFound();

  // 文末「继续阅读」:优先同一人物的其他速读,不足则回退到最新精选 —— 给读者下一步,
  // 避免读完文章后页面到底成死胡同。
  const personName = localized(video.person, "name", locale);
  const person = await getPerson(video.person.slug).catch(() => null);
  let onwardVideos = (person?.videos ?? []).filter((v) => v.slug !== slug).slice(0, 4);
  let onwardHeading = t("video.more_from", { name: personName });
  if (onwardVideos.length === 0) {
    const latest = await getLatestVideos().catch(() => []);
    onwardVideos = latest.filter((v) => v.slug !== slug).slice(0, 4);
    onwardHeading = t("video.keep_reading");
  }

  const title = localized(video, "title", locale);
  const platformLabel = video.platform === "youtube" ? "YouTube" : "B 站";
  const ai = video.ai;
  // 一句话总结作导语:S1 对 summary 硬截(160 英文/100 中文)可能截在词中
  //(如英文 "…differenti")。渲染侧回退到最近句读边界 + 省略号,避免半词结尾。
  const tidyLead = (s: string): string => {
    const t = s.trim();
    if (!t || /[。.!?！？…”"」』)]$/.test(t)) return t;
    const sentEnd = Math.max(
      t.lastIndexOf("。"), t.lastIndexOf("！"), t.lastIndexOf("？"),
      t.lastIndexOf(". "), t.lastIndexOf("! "), t.lastIndexOf("? "),
    );
    if (sentEnd > 20) return t.slice(0, sentEnd + 1).trim();
    const b = Math.max(
      t.lastIndexOf(" "), t.lastIndexOf("；"), t.lastIndexOf(";"),
      t.lastIndexOf("，"), t.lastIndexOf(","), t.lastIndexOf("、"),
    );
    return (b > 20 ? t.slice(0, b).replace(/[，、,;；\s]+$/, "") : t) + "…";
  };
  const summary = tidyLead(ai ? localized(ai, "summary", locale) : "");
  // 正文文章:优先深度解读(~1000 字 · 5 分钟读完),没有则退到速读。
  const articleRaw = ai
    ? localized(ai, "explainer_deep", locale) ||
      localized(ai, "explainer_quick", locale) ||
      ""
    : "";
  const timeline = ai ? (locale === "zh" ? ai.timeline_zh : ai.timeline_en) : [];

  // 按段落分段:优先空行,退化到单换行。
  const splitParas = (s: string) => {
    const byBlank = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (byBlank.length > 1) return byBlank;
    return s.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  };
  const paragraphs = articleRaw ? splitParas(articleRaw) : [];

  const originalUrl =
    video.platform === "youtube"
      ? `https://www.youtube.com/watch?v=${video.platform_id}`
      : `https://www.bilibili.com/video/${video.platform_id}`;

  // JSON-LD: VideoObject —— 供搜索引擎富结果 + AI 搜索引用。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: (summary || paragraphs[0] || title).slice(0, 300),
    thumbnailUrl: video.cover_url || undefined,
    uploadDate: video.published_at || undefined,
    duration: video.duration_sec
      ? `PT${Math.floor(video.duration_sec / 60)}M${video.duration_sec % 60}S`
      : undefined,
    embedUrl:
      video.platform === "youtube"
        ? `https://www.youtube.com/embed/${video.platform_id}`
        : undefined,
    contentUrl: originalUrl,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    author: { "@type": "Person", name: localized(video.person, "name", locale) },
  };

  return (
    <div className="mx-auto max-w-container px-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/"
        className="inline-block py-4 font-sans text-sm text-text-muted hover:text-link"
      >
        {t("common.back_to_home")}
      </Link>

      <RecordView slug={video.slug} />

      <SeekProvider>
        <div className="grid grid-cols-1 gap-12 pb-12 lg:grid-cols-[2fr_1fr]">
          {/* 主列:视频 + 标题 + 一段介绍 */}
          <div>
            <Player
              platform={video.platform}
              platformId={video.platform_id}
              ariaLabel={t("a11y.player_label")}
            />

            <div className="mt-6">
              <h1 className="text-5xl font-bold tracking-tight text-ink-950">{title}</h1>
              <div className="mt-3 font-sans text-sm text-text-muted">
                <Link
                  href={`/people/${video.person.slug}`}
                  className="hover:text-link"
                >
                  {localized(video.person, "name", locale)}
                </Link>{" "}
                · {formatDuration(video.duration_sec)} ·{" "}
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover"
                >
                  {t("video.source.original_link", { platform: platformLabel })}
                </a>
              </div>
              <div className="mt-4">
                <FavoriteButton slug={video.slug} />
              </div>
            </div>

            <hr className="my-10 border-border-default" />

            <AIPendingBanner status={video.ai_status} />

            {/* 一句话总结作为导语 */}
            {summary && (
              <p className="max-w-content font-serif text-2xl leading-relaxed text-ink-950">
                {summary}
              </p>
            )}

            {/* 正文文章(~5 分钟读完,对视频有整体了解) */}
            {paragraphs.length > 0 && (
              <article className="mt-8 max-w-content space-y-5 font-serif text-lg leading-loose text-ink-900">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </article>
            )}

            {video.topics.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-1.5">
                {video.topics.map((tp) => (
                  <Link key={tp.slug} href={`/topics/${tp.slug}`}>
                    <Badge>#{localized(tp, "name", locale)}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* sidebar:时间线菜单 */}
          <aside className="sticky top-[88px] self-start">
            {ai && timeline.length > 0 && (
              <div className="py-5">
                <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
                  {t("video.timeline.label")}
                </div>
                <TimelineNav items={timeline} ariaLabel={t("a11y.timeline_label")} />
              </div>
            )}
          </aside>
        </div>
      </SeekProvider>

      {/* 文末继续阅读:同一人物其他速读 / 最新精选 —— 让读者读完有下一站 */}
      {onwardVideos.length > 0 && (
        <section className="border-t border-border-default pb-24 pt-12">
          <h2 className="mb-6 text-2xl font-semibold text-ink-950">{onwardHeading}</h2>
          <VideoGrid videos={onwardVideos} locale={locale} />
        </section>
      )}
    </div>
  );
}

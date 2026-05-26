import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getVideo } from "@/lib/api";
import { Player } from "@/components/video/player";
import { TimelineNav } from "@/components/video/timeline-nav";
import { SeekProvider } from "@/components/video/seek-context";
import { FavoriteButton } from "@/components/video/favorite-button";
import { RecordView } from "@/components/video/record-view";
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
      images: video.cover_url ? [{ url: video.cover_url }] : [{ url: "/og-image.jpg" }],
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

  const title = localized(video, "title", locale);
  const platformLabel = video.platform === "youtube" ? "YouTube" : "B 站";
  const ai = video.ai;
  const summary = ai ? localized(ai, "summary", locale) : "";
  const explainer = ai ? localized(ai, "explainer_quick", locale) : "";
  const timeline = ai ? (locale === "zh" ? ai.timeline_zh : ai.timeline_en) : [];

  // 一段介绍:优先用 AI 速读总结(summary),没有则取详读首段。
  const intro =
    (summary && summary.trim()) ||
    explainer
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)[0] ||
    "";

  const originalUrl =
    video.platform === "youtube"
      ? `https://www.youtube.com/watch?v=${video.platform_id}`
      : `https://www.bilibili.com/video/${video.platform_id}`;

  // JSON-LD: VideoObject —— 供搜索引擎富结果 + AI 搜索引用。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: (intro || title).slice(0, 300),
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
        <div className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-[2fr_1fr]">
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

            {intro && (
              <p className="max-w-content font-serif text-2xl leading-loose text-ink-900">
                {intro}
              </p>
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
    </div>
  );
}

import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getVideo } from "@/lib/api";
import { Player } from "@/components/video/player";
import { SummaryBlock } from "@/components/video/summary-block";
import { KeypointsList } from "@/components/video/keypoints-list";
import { TimelineNav } from "@/components/video/timeline-nav";
import { SeekProvider } from "@/components/video/seek-context";
import { FavoriteButton } from "@/components/video/favorite-button";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { AIPendingBanner } from "@/components/shared/ai-pending-banner";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/types";
import { formatDuration, localized } from "@/lib/utils";

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
  const keypoints = ai ? (locale === "zh" ? ai.keypoints_zh : ai.keypoints_en) : [];
  const timeline = ai ? (locale === "zh" ? ai.timeline_zh : ai.timeline_en) : [];
  // Single "quick read" explainer — the quick/deep tier split was over-engineered;
  // a reader just needs to understand the video fast.
  const explainer = ai ? localized(ai, "explainer_quick", locale) : "";

  return (
    <div className="mx-auto max-w-container px-16">
      <Link
        href="/"
        className="inline-block py-4 font-sans text-sm text-text-muted hover:text-link"
      >
        {t("common.back_to_home")}
      </Link>

      <SeekProvider>
      <div className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-[2fr_1fr]">
        {/* Main column */}
        <div>
          <Player
            platform={video.platform}
            platformId={video.platform_id}
            ariaLabel={t("a11y.player_label")}
          />

          <div className="mt-6">
            <h1 className="text-5xl font-bold tracking-tight text-ink-950">{title}</h1>
            <div className="mt-3 font-sans text-sm text-text-muted">
              {localized(video.person, "name", locale)} · {formatDuration(video.duration_sec)} ·{" "}
              {platformLabel} ·{" "}
              <a
                href={
                  video.platform === "youtube"
                    ? `https://www.youtube.com/watch?v=${video.platform_id}`
                    : `https://www.bilibili.com/video/${video.platform_id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover"
              >
                {t("video.source.original_link", { platform: platformLabel })}
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <FavoriteButton />
              <LangSwitcher />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded border border-border-default px-3 py-1.5 font-sans text-sm text-ink-700 transition-colors hover:border-amber-600 hover:text-amber-600"
              >
                {t("common.share")} ↗
              </button>
            </div>
          </div>

          <hr className="my-10 border-border-default" />

          <AIPendingBanner status={video.ai_status} />

          {ai && (
            <>
              {/* 速读 = 一句话总结 + 快速理解 合并为一个「先一句话抓住,再展开读懂」的区块 */}
              <div className="font-sans text-xs uppercase tracking-widest text-text-muted">
                {t("video.explainer.label")}
              </div>
              <div className="mt-4">
                <SummaryBlock>{summary}</SummaryBlock>
              </div>
              <div className="mt-6 max-w-content">
                {explainer
                  .split("\n\n")
                  .filter((p) => p.trim().length > 0)
                  .map((para, i) => (
                    <p key={i} className="mb-4 leading-relaxed text-ink-900">
                      {para}
                    </p>
                  ))}
              </div>

              <hr className="my-10 border-border-default" />

              <div className="font-sans text-xs uppercase tracking-widest text-text-muted">
                {t("video.keypoints.label")}
              </div>
              <div className="mt-2 font-sans text-xs text-text-muted">
                {t("video.keypoints.hint_click")}
              </div>
              <div className="mt-4">
                <KeypointsList items={keypoints} />
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sticky top-[88px] self-start">
          {ai && (
            <div className="border-b border-border-default py-5">
              <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
                {t("video.timeline.label")}
              </div>
              <TimelineNav items={timeline} ariaLabel={t("a11y.timeline_label")} />
            </div>
          )}

          <div className="border-b border-border-default py-5">
            <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
              {t("video.source.label")}
            </div>
            <div className="flex justify-between py-1 font-sans text-sm">
              <span className="text-text-muted">Platform</span>
              <span className="text-ink-900">{platformLabel}</span>
            </div>
            <div className="flex justify-between py-1 font-sans text-sm">
              <span className="text-text-muted">ID</span>
              <span className="text-ink-900">{video.platform_id}</span>
            </div>
            <div className="flex justify-between py-1 font-sans text-sm">
              <span className="text-text-muted">{locale === "zh" ? "发布" : "Published"}</span>
              <span className="text-ink-900">{new Date(video.published_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</span>
            </div>
          </div>

          <div className="border-b border-border-default py-5">
            <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
              {t("video.related.people")}
            </div>
            <Link
              href={`/people/${video.person.slug}`}
              className="flex items-center gap-2.5 py-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/avatars/${video.person.slug}.jpg`}
                alt={localized(video.person, "name", locale)}
                loading="lazy"
                className="h-8 w-8 rounded-full border border-border-default object-cover"
              />
              <span className="font-serif text-base text-ink-900">
                {localized(video.person, "name", locale)}
              </span>
            </Link>
          </div>

          <div className="py-5">
            <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
              {t("video.related.topics")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {video.topics.map((tp) => (
                <Link key={tp.slug} href={`/topics/${tp.slug}`}>
                  <Badge>#{localized(tp, "name", locale)}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
      </SeekProvider>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getPerson } from "@/lib/api";
import { PersonHero } from "@/components/person/person-hero";
import { VideoGrid } from "@/components/video/video-grid";
import { localized } from "@/lib/utils";
import type { Locale } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const person = await getPerson(slug);
  if (!person) return {};
  const name = localized(person, "name", locale);
  const title = localized(person, "title", locale);
  const bio = localized(person, "bio", locale);
  const desc = (bio || `${name}${title ? " · " + title : ""} 的精选英文长访谈中文速读`).slice(0, 155);
  const path = `/people/${slug}`;
  return {
    title: `${name} · 明读`,
    description: desc,
    alternates: { canonical: `/${locale}${path}`, languages: { zh: `/zh${path}`, en: `/en${path}` } },
    openGraph: {
      title: `${name} · 明读`,
      description: desc,
      type: "profile",
      images: person.avatar_url ? [{ url: person.avatar_url }] : [{ url: "/og-image.jpg" }],
    },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const person = await getPerson(slug);
  if (!person) notFound();
  const t = await getTranslations();

  const views = locale === "zh" ? person.signature_views_zh : person.signature_views_en;

  return (
    <div className="mx-auto max-w-container px-16">
      <Link
        href="/"
        className="inline-block pt-6 font-sans text-sm text-text-muted hover:text-link"
      >
        {t("common.back_to_home")}
      </Link>

      <PersonHero person={person} locale={locale} />

      {/* 代表观点:有内容才展示;为空时整段隐藏(不显"生成中"占位),
          页面从简介直接流到相关视频。 */}
      {views.length > 0 && (
        <>
          <hr className="my-12 border-border-default" />
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-ink-950">
              {t("person.signature_views")}
            </h2>
            <div className="flex max-w-[880px] flex-col gap-6">
              {views.map((v, i) => (
                <div key={i} className="border-l-[3px] border-amber-600 pl-6">
                  <p className="font-serif text-2xl italic leading-relaxed text-ink-900">
                    <span className="text-amber-600">❝ </span>
                    {v.quote}
                    <span className="text-amber-600"> ❞</span>
                  </p>
                  <p className="mt-2.5 font-sans text-sm text-text-muted">
                    {t("person.cite_prefix")}{" "}
                    <Link
                      href={`/videos/${v.from_video_slug}`}
                      className="text-link hover:text-link-hover"
                    >
                      {v.from_video_title}
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <hr className="my-12 border-border-default" />

      <section className="pb-24">
        <h2 className="mb-6 text-2xl font-semibold text-ink-950">
          {t("person.related_videos")}
        </h2>
        {person.videos.length === 0 ? (
          <p className="text-text-muted">{t("person.no_videos")}</p>
        ) : (
          <VideoGrid videos={person.videos} locale={locale} />
        )}
      </section>
    </div>
  );
}

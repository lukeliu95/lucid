import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getTopic } from "@/lib/api";
import { VideoGrid } from "@/components/video/video-grid";
import { PersonRail } from "@/components/person/person-card";
import type { Locale } from "@/lib/types";
import { localized } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const topic = await getTopic(slug);
  if (!topic) return {};
  const name = localized(topic, "name", locale);
  const intro = localized(topic, "intro", locale);
  const desc = (intro || `关于「${name}」的英文长访谈中文速读精选`).slice(0, 155);
  const path = `/topics/${slug}`;
  return {
    title: `${name} · 明读`,
    description: desc,
    alternates: { canonical: `/${locale}${path}`, languages: { zh: `/zh${path}`, en: `/en${path}` } },
    openGraph: { title: `${name} · 明读`, description: desc, type: "website", images: [{ url: "/og-image.jpg" }] },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const topic = await getTopic(slug);
  if (!topic) notFound();
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-container px-16 pb-24">
      <Link
        href="/"
        className="inline-block pt-6 font-sans text-sm text-text-muted hover:text-link"
      >
        {t("common.back_to_home")}
      </Link>

      <section className="py-12">
        <div className="font-sans text-xs uppercase tracking-widest text-text-muted">
          {t("home.section.topics")}
        </div>
        <h1 className="mt-3 text-6xl font-bold tracking-tight text-amber-600">
          #{localized(topic, "name", locale)}
        </h1>
        <p className="mt-4 max-w-content text-md leading-relaxed text-ink-900">
          {localized(topic, "intro", locale)}
        </p>
        <p className="mt-2 font-sans text-sm text-text-muted">
          {t("topic.videos_count", { count: topic.videos.length })}
        </p>
      </section>

      <hr className="my-8 border-border-default" />

      {topic.related_people.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
            {t("topic.related_people")}
          </div>
          <PersonRail people={topic.related_people} locale={locale} />
        </section>
      )}

      <section>
        <h2 className="mb-6 text-2xl font-semibold text-ink-950">
          {t("topic.videos_section")}
        </h2>
        <VideoGrid videos={topic.videos} locale={locale} />
      </section>
    </div>
  );
}

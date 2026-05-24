import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getHero, getLatestVideos, getTopics, getAllPeople } from "@/lib/api";
import { VideoGrid } from "@/components/video/video-grid";
import { PersonRail } from "@/components/person/person-card";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/types";
import { localized } from "@/lib/utils";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const t = await getTranslations();

  const [hero, videos, topics, people] = await Promise.all([
    getHero(),
    getLatestVideos(),
    getTopics(),
    getAllPeople(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border-default py-16 md:py-20">
        <div className="mx-auto max-w-container px-16">
          <div className="font-sans text-xs uppercase tracking-widest text-text-muted">
            {t("home.hero.label")}
          </div>
          <h1 className="mt-4 max-w-[920px] text-[44px] font-bold leading-[1.2] tracking-tight text-ink-950">
            {localized(hero, "title", locale)}
          </h1>
          {hero.ai && (
            <blockquote className="mt-6 max-w-[800px] border-l-4 border-amber-600 pl-6 font-serif text-3xl leading-snug text-amber-700">
              <span aria-hidden>「</span>
              {localized(hero.ai, "summary", locale)}
              <span aria-hidden>」</span>
            </blockquote>
          )}
          <div className="mt-8">
            <Link
              href={`/videos/${hero.slug}`}
              className="font-sans text-base font-semibold text-link hover:text-link-hover"
            >
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* TopicStrip */}
      <section className="border-b border-border-default">
        <div className="mx-auto flex max-w-container flex-wrap items-center gap-6 px-16 py-5 text-lg">
          <span className="font-sans text-xs uppercase tracking-widest text-text-muted">
            {t("home.section.topics")}
          </span>
          {topics.map((tp, i) => (
            <span key={tp.slug} className="flex items-center gap-6">
              <Link
                href={`/topics/${tp.slug}`}
                className="text-ink-700 hover:text-amber-600"
              >
                {localized(tp, "name", locale)}
              </Link>
              {i < topics.length - 1 && <span className="text-ink-300">·</span>}
            </span>
          ))}
        </div>
      </section>

      {/* PersonRail */}
      <section className="border-b border-border-default">
        <div className="mx-auto max-w-container px-16 py-8">
          <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
            {t("home.section.people")}
          </div>
          <PersonRail people={people} locale={locale} />
        </div>
      </section>

      {/* Latest grid */}
      <section className="mx-auto max-w-container px-16 py-12">
        <h2 className="mb-6 text-3xl font-semibold tracking-tight text-ink-950">
          {t("home.section.latest")}
        </h2>
        <VideoGrid videos={videos} locale={locale} />
        <div className="mt-12 flex justify-center">
          <Button variant="ghost">{t("home.load_more")}</Button>
        </div>
      </section>
    </>
  );
}

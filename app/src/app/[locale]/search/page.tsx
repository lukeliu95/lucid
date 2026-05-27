import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { search, getTopics, getAllPeople } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { CoverImage } from "@/components/ui/cover-image";
import { PersonRail } from "@/components/person/person-card";
import { Highlight } from "@/components/shared/mark";
import type { Locale } from "@/lib/types";
import { formatDuration, localized } from "@/lib/utils";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; mode?: string }>;
}) {
  const { locale: l } = await params;
  const sp = await searchParams;
  setRequestLocale(l);
  const locale = l as Locale;
  const t = await getTranslations();

  const q = (sp.q ?? "").trim();
  const mode: "keyword" | "semantic" = sp.mode === "semantic" ? "semantic" : "keyword";
  const results = await search(q, mode);
  const total = results.videos.length + results.people.length + results.topics.length;

  if (!q) {
    // 空查询不再是空白页 —— 给读者可点的探索入口(热门主题 + 人物)。
    const [topics, people] = await Promise.all([
      getTopics().catch(() => []),
      getAllPeople().catch(() => []),
    ]);
    return (
      <div className="mx-auto max-w-container px-16 py-16">
        <h1 className="text-4xl font-bold text-ink-950">{t("nav.search")}</h1>
        <p className="mt-3 text-text-muted">{t("search.explore_hint")}</p>

        {topics.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
              {t("search.section.topics")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((tp) => (
                <Link key={tp.slug} href={`/topics/${tp.slug}`}>
                  <Badge>#{localized(tp, "name", locale)}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {people.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 font-sans text-xs uppercase tracking-widest text-text-muted">
              {t("search.section.people")}
            </h2>
            <PersonRail people={people} locale={locale} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-16">
      <section className="py-12">
        <h1 className="text-4xl font-bold tracking-tight text-ink-950">
          {locale === "zh" ? "搜索 " : 'Search "'}
          <mark>{q}</mark>
          {locale === "zh" ? "" : '"'}
        </h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          {t("search.count", { count: total })}
        </p>
        <div className="mt-6 inline-flex items-center rounded bg-bg-subtle p-0.5 font-sans text-sm">
          <Link
            href={`/search?q=${encodeURIComponent(q)}&mode=keyword`}
            className={`rounded-sm px-4 py-1.5 ${mode === "keyword" ? "bg-bg-elev font-semibold text-link shadow-sm" : "text-text-muted"}`}
          >
            {t("search.mode.keyword")}
          </Link>
          <Link
            href={`/search?q=${encodeURIComponent(q)}&mode=semantic`}
            className={`rounded-sm px-4 py-1.5 ${mode === "semantic" ? "bg-bg-elev font-semibold text-link shadow-sm" : "text-text-muted"}`}
          >
            {t("search.mode.semantic")}
          </Link>
        </div>
      </section>

      {total === 0 && (
        <section className="py-12">
          <p className="text-lg text-ink-700">
            {t("search.empty", { query: q })}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {t("search.empty_suggest")}{" "}
            <Link href="/topics/ai" className="text-link hover:text-link-hover">AI</Link>
            {" · "}
            <Link href="/topics/ai-agent" className="text-link hover:text-link-hover">AI Agent</Link>
            {" · "}
            <Link href="/topics/startup" className="text-link hover:text-link-hover">{t("topic.slug.startup")}</Link>
          </p>
        </section>
      )}

      {results.videos.length > 0 && (
        <section className="mt-8" aria-live="polite">
          <h2 className="mb-4 border-b border-border-default pb-2 font-sans text-base font-semibold text-ink-950">
            {t("search.section.videos")}{" "}
            <span className="ml-1.5 font-normal text-text-muted">{results.videos.length}</span>
          </h2>
          {results.videos.map((v) => (
            <Link
              key={v.slug}
              href={`/videos/${v.slug}`}
              className="grid grid-cols-[200px_1fr] gap-5 border-b border-border-default py-5 transition-colors hover:bg-bg-elev"
            >
              <div className="relative aspect-video overflow-hidden rounded border border-border-default bg-gradient-to-br from-paper-300 to-paper-400">
                {v.cover_url && (
                  <CoverImage
                    src={v.cover_url}
                    alt={localized(v, "title", locale)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="font-serif text-lg font-semibold leading-snug text-ink-900">
                  <Highlight text={localized(v, "title", locale)} q={q} />
                </div>
                <div className="mt-1.5 font-sans text-sm text-text-muted">
                  {localized(v.person, "name", locale)} · {formatDuration(v.duration_sec)}{" "}
                  {v.topics[0] && (
                    <span className="ml-2">
                      <Badge>{localized(v.topics[0], "name", locale)}</Badge>
                    </span>
                  )}
                </div>
                {(v.one_liner_zh || v.one_liner_en) && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">
                    <Highlight text={localized(v, "one_liner", locale) || ""} q={q} />
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}

      {results.people.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 border-b border-border-default pb-2 font-sans text-base font-semibold text-ink-950">
            {t("search.section.people")}{" "}
            <span className="ml-1.5 font-normal text-text-muted">{results.people.length}</span>
          </h2>
          {results.people.map((p) => (
            <Link
              key={p.slug}
              href={`/people/${p.slug}`}
              className="grid grid-cols-[64px_1fr] items-center gap-4 border-b border-border-default py-4 transition-colors hover:bg-bg-elev"
            >
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt={localized(p, "name", locale)}
                  loading="lazy"
                  className="h-[60px] w-[60px] rounded-full border border-border-default object-cover"
                />
              ) : (
                <div className="h-[60px] w-[60px] rounded-full border border-border-default bg-gradient-to-br from-paper-300 to-paper-400" />
              )}
              <div>
                <div className="font-serif text-lg font-semibold text-ink-900">
                  <Highlight text={localized(p, "name", locale)} q={q} />
                </div>
                <p className="mt-1 text-sm text-text-muted line-clamp-1">
                  <Highlight text={localized(p, "bio", locale)} q={q} />
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {results.topics.length > 0 && (
        <section className="mt-12 pb-24">
          <h2 className="mb-4 border-b border-border-default pb-2 font-sans text-base font-semibold text-ink-950">
            {t("search.section.topics")}{" "}
            <span className="ml-1.5 font-normal text-text-muted">{results.topics.length}</span>
          </h2>
          {results.topics.map((tp) => (
            <Link
              key={tp.slug}
              href={`/topics/${tp.slug}`}
              className="flex items-baseline gap-4 border-b border-border-default py-4 transition-colors hover:bg-bg-elev"
            >
              <span className="font-serif text-2xl font-semibold text-amber-600">
                #<Highlight text={localized(tp, "name", locale)} q={q} />
              </span>
              <span className="text-sm text-ink-700">
                <Highlight text={localized(tp, "intro", locale)} q={q} />
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { changelog } from "@/lib/changelog";
import type { Locale } from "@/lib/types";

const zh = (l: string) => l === "zh";

const COPY = {
  title: { zh: "动态 · 明读怎么长出来的", en: "Changelog · How Lucid is being built" },
  subtitle: {
    zh: "公开记录明读的每一步:做了什么、踩了什么坑、为什么这么决定。",
    en: "Building Lucid in public — what got made, what broke, and why each call was made.",
  },
  desc: {
    zh: "明读的公开开发日志 —— AI 视频速读站的每一步迭代记录。",
    en: "Lucid's build-in-public changelog — every iteration of the AI video speed-read site.",
  },
  example: { zh: "看个例子 →", en: "See an example →" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as Locale;
  const path = "/changelog";
  return {
    title: `${zh(l) ? COPY.title.zh : COPY.title.en} · 明读`,
    description: zh(l) ? COPY.desc.zh : COPY.desc.en,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { zh: `/zh${path}`, en: `/en${path}` },
    },
    openGraph: {
      title: zh(l) ? COPY.title.zh : COPY.title.en,
      description: zh(l) ? COPY.desc.zh : COPY.desc.en,
      type: "website",
    },
  };
}

function fmtDate(d: string, l: string): string {
  const [y, m, day] = d.split("-").map(Number);
  if (zh(l)) return `${y} 年 ${m} 月 ${day} 日`;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  setRequestLocale(l);

  return (
    <div className="mx-auto max-w-content px-16 py-12 pb-28">
      <header className="border-b border-border-default pb-10">
        <h1 className="font-serif text-5xl leading-tight text-ink-950">
          {zh(l) ? COPY.title.zh : COPY.title.en}
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-text-muted">
          {zh(l) ? COPY.subtitle.zh : COPY.subtitle.en}
        </p>
      </header>

      <div className="mt-4">
        {changelog.map((e, i) => {
          const title = zh(l) ? e.title_zh : e.title_en;
          const tag = zh(l) ? e.tag_zh : e.tag_en;
          const body = zh(l) ? e.body_zh : e.body_en;
          return (
            <article
              key={`${e.date}-${i}`}
              className="border-b border-border-default py-12 last:border-b-0"
            >
              <div className="flex items-center gap-3 font-sans text-sm text-text-muted">
                <time dateTime={e.date}>{fmtDate(e.date, l)}</time>
                <Badge>{tag}</Badge>
              </div>

              <h2 className="mt-4 font-serif text-3xl leading-snug text-ink-950">
                {title}
              </h2>

              <div className="mt-5 max-w-content space-y-4 font-serif text-lg leading-loose text-ink-900">
                {body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>

              {e.image && (
                <div className="mt-7 overflow-hidden rounded-lg border border-border-default">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.image}
                    alt={title}
                    width={1200}
                    height={630}
                    className="block h-auto w-full"
                    loading="lazy"
                  />
                </div>
              )}

              {e.video_slug && (
                <div className="mt-6">
                  <Link
                    href={`/videos/${e.video_slug}`}
                    className="font-sans text-sm text-link hover:text-link-hover"
                  >
                    {zh(l) ? COPY.example.zh : COPY.example.en}
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { VideoCard } from "@/components/video/video-card";
import { getUserFavorites, getUserHistory } from "@/lib/user-data";
import type { Locale, VideoCard as VideoCardType } from "@/lib/types";

export const dynamic = "force-dynamic";

const zh = (l: string) => l === "zh";

function Grid({ items, locale }: { items: VideoCardType[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((v) => (
        <VideoCard key={v.slug} video={v} locale={locale} />
      ))}
    </div>
  );
}

export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const t = await getTranslations();
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto max-w-container px-16 py-28 text-center">
        <h1 className="font-serif text-4xl text-ink-950">
          {zh(l) ? "我的内容" : "My Library"}
        </h1>
        <p className="mt-4 font-sans text-text-muted">
          {zh(l)
            ? "登录后管理你的收藏与查看记录。"
            : "Sign in to manage your favorites and watch history."}
        </p>
        <div className="mt-8 inline-block">
          <SignInButton mode="modal">
            <button className="inline-flex h-10 items-center rounded-full border border-border-default bg-bg-subtle px-6 font-sans text-sm text-ink-700 transition-colors hover:text-link">
              {t("nav.login")}
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const [favorites, history] = await Promise.all([
    getUserFavorites(userId),
    getUserHistory(userId),
  ]);

  return (
    <div className="mx-auto max-w-container px-16 py-12 pb-24">
      <h1 className="font-serif text-4xl text-ink-950">
        {zh(l) ? "我的内容" : "My Library"}
      </h1>

      <section className="mt-12">
        <h2 className="mb-6 font-sans text-xs uppercase tracking-widest text-text-muted">
          {zh(l) ? "我的收藏" : "Favorites"}
        </h2>
        {favorites.length > 0 ? (
          <Grid items={favorites} locale={locale} />
        ) : (
          <p className="font-sans text-sm text-text-muted">
            {zh(l) ? "还没有收藏。" : "No favorites yet."}
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="mb-6 font-sans text-xs uppercase tracking-widest text-text-muted">
          {zh(l) ? "最近查看" : "Recently viewed"}
        </h2>
        {history.length > 0 ? (
          <Grid items={history} locale={locale} />
        ) : (
          <p className="font-sans text-sm text-text-muted">
            {zh(l) ? "还没有查看记录。" : "No watch history yet."}
          </p>
        )}
      </section>
    </div>
  );
}

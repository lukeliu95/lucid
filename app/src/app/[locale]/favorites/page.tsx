import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-container px-16 py-16">
      <h1 className="text-4xl font-bold text-ink-950">{t("me.favorites.title")}</h1>
      <p className="mt-6 text-text-muted">{t("me.favorites.empty")}</p>
      <div className="mt-8">
        <Link href="/" className="text-link hover:text-link-hover">
          {t("common.back_to_home")}
        </Link>
      </div>
      <p className="mt-12 font-sans text-xs text-text-muted">
        Phase B.2 · Clerk auth + Drizzle 接入后启用。
      </p>
    </div>
  );
}

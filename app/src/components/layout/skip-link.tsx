import { getTranslations } from "next-intl/server";

export async function SkipLink() {
  const t = await getTranslations("a11y");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-toast focus:rounded focus:bg-amber-600 focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:text-paper-50"
    >
      {t("skip_to_main")}
    </a>
  );
}

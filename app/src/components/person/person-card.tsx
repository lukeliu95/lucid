import { Link } from "@/i18n/routing";
import type { PersonDetail, Locale } from "@/lib/types";
import { localized } from "@/lib/utils";

export function PersonRail({
  people,
  locale,
}: {
  people: Array<Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url">>;
  locale: Locale;
}) {
  // 按字母顺序(英文名)排列;多行换行展示,不横向滚动。
  const sorted = [...people].sort((a, b) => a.name_en.localeCompare(b.name_en));
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-7">
      {sorted.map((p) => (
        <Link
          key={p.slug}
          href={`/people/${p.slug}`}
          className="flex w-[72px] flex-col items-center gap-2"
        >
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.avatar_url}
              alt={localized(p, "name", locale)}
              loading="lazy"
              className="h-16 w-16 rounded-full border border-border-default object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border border-border-default bg-gradient-to-br from-paper-300 to-paper-400" />
          )}
          <div className="text-center font-sans text-sm leading-tight text-ink-700">
            {localized(p, "name", locale)}
          </div>
        </Link>
      ))}
    </div>
  );
}

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
  return (
    <div className="flex gap-8 overflow-x-auto pb-2">
      {people.map((p) => (
        <Link
          key={p.slug}
          href={`/people/${p.slug}`}
          className="flex min-w-[80px] flex-col items-center gap-2"
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
          <div className="font-sans text-sm text-ink-700">{localized(p, "name", locale)}</div>
        </Link>
      ))}
    </div>
  );
}

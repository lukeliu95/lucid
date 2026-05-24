import { getTranslations } from "next-intl/server";
import type { AIStatus } from "@/lib/types";

export async function AIPendingBanner({ status }: { status: AIStatus }) {
  if (status === "ai_done") return null;
  const t = await getTranslations("video.ai_status");
  const msg = status === "failed" ? t("failed") : t("pending");
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded border border-border-default bg-amber-50 px-4 py-3 font-sans text-sm text-amber-700"
    >
      {msg}
    </div>
  );
}

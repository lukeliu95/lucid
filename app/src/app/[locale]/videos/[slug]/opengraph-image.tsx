import { ImageResponse } from "next/og";
import { getVideo } from "@/lib/api";
import { localized } from "@/lib/utils";
import type { Locale } from "@/lib/types";

export const runtime = "nodejs";
export const alt = "明读 / Lucid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://lucid.simprr.com");

// @vercel/og 渲染中文需显式加载 CJK 字体;用 Google Fonts CSS2 按文本子集化(只取用到的字,体积小)。
async function loadCJK(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const m = css.match(/src:\s*url\(([^)]+)\)/);
    if (!m) return null;
    return await (await fetch(m[1])).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const video = await getVideo(slug).catch(() => null);

  const brand = "明读 / Lucid";
  const title = video ? localized(video, "title", locale) : brand;
  const person = video ? localized(video.person, "name", locale) : "";
  const summary = video?.ai ? localized(video.ai, "summary", locale) : "";
  const sub = summary || "把长内容读明白 · 5 小时英文,5 分钟中文读懂";

  // 子集化字体:标题 + 人物 + 品牌 + 副文案用到的字
  const fontText = `${title}${person}${brand}${sub}把长内容读明白 速读·明读 ${"0123456789"}`;
  const font = await loadCJK(fontText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F0E0",
          padding: "72px 80px",
          fontFamily: font ? "Noto Sans SC" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#C2410C" }} />
          <div style={{ fontSize: 30, color: "#9A3412", fontWeight: 700 }}>{brand}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 60, lineHeight: 1.25, color: "#1C1917", fontWeight: 700 }}>
            {title.slice(0, 42)}
          </div>
          <div style={{ fontSize: 30, color: "#57534E", lineHeight: 1.5 }}>
            {sub.slice(0, 64)}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, color: "#44403C", fontWeight: 700 }}>
            {person ? `— ${person}` : ""}
          </div>
          <div style={{ fontSize: 26, color: "#A8A29E" }}>lucid.simprr.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Noto Sans SC", data: font, weight: 700 as const, style: "normal" as const }]
        : [],
    },
  );
}

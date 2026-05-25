import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js) — zero-dependency, env-gated.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_ID is set (e.g. "G-XXXXXXXXXX"),
 * so dev / preview without a GA id stays clean. Set the id in .env.local
 * or in Vercel project env vars.
 *
 * `afterInteractive` keeps the tag out of the critical render path.
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}

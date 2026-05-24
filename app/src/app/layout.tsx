// Minimal root layout — actual <html>/<body> lives in [locale]/layout.tsx
// per the canonical next-intl App Router pattern. This file exists only to
// satisfy Next.js's requirement that there be a root layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

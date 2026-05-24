# kdsj-world · 看懂世界

AI 视频知识解释平台 · Next.js 15 App Router · next-intl · Tailwind · shadcn-style components.

## Stack

- Next.js 15 (App Router) + React 19
- next-intl (`[locale]` segment · zh default + en)
- Tailwind CSS 3 + DTCG tokens from `docs/design/tokens/`
- TypeScript strict
- Mock data via `src/lib/mock-data.ts` (Phase B.1) · 切换至真 API 走 `src/lib/api.ts`

## Dev

```bash
npm install
npm run dev          # http://localhost:3000  → 重定向到 /zh
npm run build
npm run typecheck
```

## Routes

- `/[locale]`                  · 首页
- `/[locale]/videos/[slug]`    · 视频详情(2 档解释 + 时间轴 + 来源)
- `/[locale]/people/[slug]`    · 人物页
- `/[locale]/search?q=...`     · 搜索结果
- `/[locale]/topics/[slug]`    · 主题页
- `/[locale]/favorites`        · 收藏(Phase B.2 接 Clerk)
- `/api/health`                · 占位

## Phase

Phase B.1 (frontend by 小赵). Backend / auth (Clerk) / DB (Neon + Drizzle) by 大刘 B.2.

策划:Simprr · https://x.com/simprr

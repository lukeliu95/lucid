# Round-008 · Build & 移动响应式 Baseline

> 2026-05-25 · 老吴自主巡检 · YouTube API 日配额未恢复(403/429),本轮做不依赖 API 的工程验证。

## 1. `next build` 产物体积

| Route | Size | First Load JS |
|---|---|---|
| `/[locale]` (zh/en 首页) | 489 B | **111 kB** |
| `/[locale]/videos/[slug]` | 2.5 kB | **139 kB**(最重 · 含 player + tabs) |
| `/[locale]/people/[slug]` | 489 B | 111 kB |
| `/[locale]/topics/[slug]` | 489 B | 111 kB |
| `/[locale]/search` | 181 B | 110 kB |
| `/[locale]/favorites` | 181 B | 110 kB |
| API routes (10 个) | 162 B | 100 kB |
| `/icon.svg` | 0 B | 0 B |
| **Shared by all** | — | **100 kB** |
| Middleware (next-intl) | — | 81.6 kB |

Shared chunks:
- `chunks/4bd1b696` 52.5 kB
- `chunks/517` 45.5 kB
- other 1.91 kB

**评价**: First Load 100–139 kB,对 Next 15 App Router + next-intl + shadcn 的双语站属正常偏轻。无超大 bundle。视频详情页 139 kB 最重(player/tabs/timeline 都在),可接受。

## 2. Build 警告处理

| 警告 | 处理 |
|---|---|
| ⚠ `metadataBase property not set` → OG/Twitter 图用 localhost 解析 | ✅ **已修** — `[locale]/layout.tsx` 加 `metadataBase`,优先 `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL`,dev 回落 localhost。重新 build 后该警告消失。 |
| ⚠ `edge runtime disables static generation` | 保留 — AI chat 走 edge function 是设计选择(DeepSeek 代理),非缺陷。 |

Build exit code: **0** ✅

## 3. 移动端响应式(390×844 iPhone viewport)

> 注:intent-brief 已将"移动响应式"列为 **killed requirement(v1.1+)**,本站桌面优先,顶部有 `mobile-hint-banner` 提示。本轮只验证"移动端不彻底崩坏、可降级使用"。

| 页面 | 移动端表现 | 结论 |
|---|---|---|
| 首页 `/zh` | 单列视频网格 · person rail 横向滚动 · hero/badge 正常 · "即将上线"角标可见 | ✅ 可用 |
| 人物页 `/zh/people/sam-altman` | e-ink 肖像居中 · 标题/bio 纵向堆叠良好 · console 0 error | ✅ 可用 |

**已知移动端瑕疵(不阻塞 · 桌面优先 scope)**:
- 顶部 logo「看懂世界」在 390px 下换行成竖排,与 mobile-hint-banner 文字轻微重叠。属 cosmetic,v1.1 做移动适配时一并处理。

## 4. console error 验证

- 首页 / 人物页:除 1 个 `witILEF-OhQ/maxresdefault.jpg` 的预期 404(缩略图 fallback 链 maxres→hq 触发前的探测,图最终正常显示)外,**无真实 error**。

## 结论

工程层健康:build PASS · bundle 体积正常 · metadataBase 警告清零 · 移动端降级可用无崩坏。
唯一卡点仍是 YouTube API 日配额(补视频 17→27 待配额重置后批量做)。

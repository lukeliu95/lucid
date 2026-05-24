# Build & Type Check Results · kdsj-world Phase C

> 2026-05-24 · 阿May
> Working dir: `app/`

---

## 1. `npm install`

已在 frontend/generate 阶段完成 · `node_modules` 存在 · 跳过重跑。

---

## 2. `npm run build`

### 2.1 不传 DATABASE_URL(裸跑)

```
> next build
   ▲ Next.js 15.0.3
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
[db] DATABASE_URL not set — runtime calls will fail
Error: Database connection string format for `neon()` should be: postgresql://...
    at neon (./.next/server/chunks/826.js:29:1616)
    at 4640 (./.next/server/app/api/people/[slug]/route.js)
> Build error occurred: Failed to collect page data for /api/people/[slug]
```

❌ **裸跑 FAIL** — 与 W3 工单一致(大刘 `src/db/client.ts` 模块级 `neon()` 调用 · 要求 build 时必须传 DATABASE_URL)。

### 2.2 传 stub DATABASE_URL

```bash
DATABASE_URL='postgresql://stub:stub@localhost:5432/stub' npm run build
```

```
 ✓ Compiled successfully
 ✓ Generating static pages (10/10)
 ✓ Collecting build traces
Route (app)                              Size     First Load JS
┌ ○ /_not-found                          896 B           101 kB
├ ● /[locale]                            189 B           110 kB   (zh, en SSG)
├ ● /[locale]/favorites                  189 B           110 kB
├ ƒ /[locale]/people/[slug]              189 B           110 kB
├ ● /[locale]/search                     189 B           110 kB
├ ƒ /[locale]/topics/[slug]              189 B           110 kB
├ ƒ /[locale]/videos/[slug]              2.5 kB          139 kB
├ ƒ /api/admin/videos                    162 B           100 kB
├ ƒ /api/ai/chat                         162 B           100 kB
├ ƒ /api/favorites                       162 B           100 kB
├ ○ /api/health                          162 B           100 kB
├ ƒ /api/people/[slug]                   162 B           100 kB
├ ƒ /api/search                          162 B           100 kB
├ ƒ /api/topics/[slug]                   162 B           100 kB
├ ƒ /api/videos                          162 B           100 kB
└ ƒ /api/videos/[slug]                   162 B           100 kB
+ First Load JS shared by all            100 kB
ƒ Middleware                             81.6 kB
```

✅ **PASS**

### 2.3 评估

| 项 | 值 | 预算 | 状态 |
|---|---|---|---|
| 首页 First Load | 110 KB | < 200 KB(handoff §性能预算) | ✅ |
| video-detail | 139 KB | < 200 KB | ✅ |
| Middleware | 81.6 KB | — | ⚠ 偏大但 next-intl 标准量级 |
| Static pages | 10 | — | ✅ |
| Route 数 | 16 (6 页 + 9 API + 1 _not-found) | 与 frontend_summary 一致 | ✅ |

### 2.4 W3 工单状态

**确认存在 · 非阻塞**: build 必须传 `DATABASE_URL`。Vercel 部署时 Marketplace Neon 集成自动注入 `DATABASE_URL`,所以生产部署不会复现。本地 dev 也有 `.env.local`。CI 配置需注意。

→ **建议**: 大刘把 `src/db/client.ts` 改 lazy init(W3 ticket 已记录)· 5-31 上线前可推到 Phase D。

---

## 3. `npx tsc --noEmit`

```
tsconfig.json(11,25): error TS6046: Argument for '--moduleResolution' option must be: 'node', 'classic', 'node16', 'nodenext'.
tsconfig.json(12,5): error TS5070: Option '--resolveJsonModule' cannot be specified without 'node' module resolution strategy.
TypeScript: 2 errors in 1 files
```

❌ **standalone tsc FAIL** = W4 工单(`moduleResolution: "bundler"` 是 Next.js 15 / next-intl 要求的值,但 standalone tsc CLI 不识别 · Next 内置 tsc 已通过)

**Next build 期 type check ✅ PASS**(见 §2.2 "Linting and checking validity of types ..." 通过)

→ **非阻塞** · pipeline-state `tsc_via_next_passed=true`。

---

## 4. Bundle 分析

- 共享 chunks: 100 KB(React + Next + next-intl 基线)
- 业务代码增量: 每页 ~10 KB
- 最大页 = video-detail (139 KB) · 主要是 timeline-nav + two-tier-tabs + player components

无超大依赖被打入(no moment / no lodash 全包)。✅

---

## 总评

| 指标 | 结果 |
|---|---|
| npm install | ✅ |
| npm run build (with DATABASE_URL stub) | ✅ |
| npm run build (without DATABASE_URL) | ❌ W3(已知 · 非阻塞) |
| Next-internal tsc | ✅ |
| standalone tsc | ❌ W4(已知 · 非阻塞) |
| Bundle < 200KB | ✅ |
| Routes 完整 | ✅ |

**结论**: build 健康 · 2 个已知 W 工单非阻塞。

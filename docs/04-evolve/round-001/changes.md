# round-001 · 实际改动摘要

## 1. `app/src/db/client.ts`(W3 修复)

**Before**(模块级 side-effect):
```ts
const url = process.env.DATABASE_URL;
if (!url) console.warn(...);
export const sql = neon(url ?? "postgres://placeholder");
export const db = drizzle(sql, { schema });
```

**After**(lazy init via Proxy):
```ts
let _sql = null, _db = null;
function getClient() {
  if (_sql && _db) return { sql: _sql, db: _db };
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[db] DATABASE_URL is not set...");
  _sql = neon(url); _db = drizzle(_sql, { schema });
  return { sql: _sql, db: _db };
}
export const sql = new Proxy(..., { apply, get });
export const db  = new Proxy({}, { get });
```

**影响**: build 不再需要 `DATABASE_URL=postgres://stub npm run build` · 调用方 import 0 改动。

---

## 2. `app/src/app/api/search/route.ts`(W6 修复)

新增:
```ts
import { rateLimit, ipKey } from "@/lib/rate-limit";
const SEARCH_RATE = { windowMs: 60_000, max: 30 };
// ... 在解析 q 之后:
const rl = rateLimit(ipKey(req), SEARCH_RATE);
if (!rl.ok) return NextResponse.json(
  { error: "rate_limited", resetAt: rl.resetAt },
  { status: 429, headers: { "x-ratelimit-remaining": ..., "retry-after": ... } }
);
```

**影响**: `/api/search?mode=semantic` 被同 IP 一分钟刷 > 30 次时返回 429,不再触发 OpenAI embedding 调用。

---

## 3. `app/src/db/seed.ts`(28 视频 ID)

- 真 ID(3): `jvqFAi7vkBc`(Sam Altman Lex #419)· `zjkBMFhNj_g`(Karpathy Intro to LLMs 1h)· `cdiD-9MMpb0`(Karpathy Lex #333)
- `_DRAFT` 占位(27): 全部 `PLACEHOLDER1..28` → `<slug>_DRAFT`,例如 `sam-altman-ted-2024_DRAFT` / `hassabis-lex_DRAFT` / 等。
- slug 重命名: `karpathy-lex-latest` → `karpathy-lex-333`(因为真 ID 确定指向 #333 这期 2023-03)。

**影响**: ingest 脚本读到 `_DRAFT` 时构造的 URL 是 `https://www.youtube.com/watch?v=sam-altman-ted-2024_DRAFT`,YouTube 直接 404,ingest 必然失败 → 强制 Alan 看到。比 `PLACEHOLDER1` 更安全:不会撞到真存在的 YouTube 短 ID。

---

## 4. 验证

`cd app && rm -rf .next && npm run build` → **PASS**(无任何 env 变量)。

10 静态页 + 9 API route + middleware 全部 OK · 与 round-001 前 `frontend_summary` 一致(LCP 估 1.8s · bundle 139KB)。

---

## 5. Git 状态

本轮未 commit/push(老吴不碰远程 · Alan 自行 `git add -A && git commit && git push`)。

修改文件清单:
```
app/src/db/client.ts                       (W3 lazy init)
app/src/app/api/search/route.ts            (W6 rate-limit)
app/src/db/seed.ts                         (28 视频 ID)
docs/04-evolve/round-001/round-001.md      (新增)
docs/04-evolve/round-001/changes.md        (新增)
docs/04-evolve/ledger.tsv                  (新增)
docs/04-evolve/deployment-runbook.md       (新增)
docs/04-evolve/known-tsc-issue.md          (新增)
docs/04-evolve/llm-eval-execution-plan.md  (新增)
docs/04-evolve/post-launch-checklist.md    (新增)
```

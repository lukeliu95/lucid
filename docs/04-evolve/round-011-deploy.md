# Round-011 · A+B+C 交付:中文 OG / 接真数据库 / 上线 Vercel

> 2026-05-25 · 老吴 + 大刘 + Mia · 用户指令 a+b+c

## A · OG 主视觉重出(中文「明读」)
- 用 APImart `gpt-image-2`(文字渲染强)重出 OG,印章正确写出「明读」简体二字(Gemini flash 之前出成"朗讀")。
- PNG 3.4MB → JPG 1536×864 / 695KB,替换 `public/og-image.jpg`。

## B · 接真数据库(Neon Postgres)
- **provision**:`vercel integration add neon` → 资源 `lucid-db` 连到项目 `lucid`,`DATABASE_URL` 等自动注入(production / preview / development)。
- **schema**:pgvector 0.8.0 扩展 + `drizzle-kit push --force` 建 8 张表。
- **seed**:`db/seed.ts` 重写,从 `lib/mock-data.ts`(当前真源)播种 → 5 topics / 10 people(+avatar+signature_views)/ 30 videos / 32 关联 / 29 AI 成稿。
- **读取切换**:`lib/api.ts` `useDb()` = `DATABASE_URL` 存在且 `USE_MOCK_API!=="true"` → 走 `lib/db-api.ts`(Drizzle 关系查询);否则回落 mock(本地/无库优雅降级)。
- **验证**:临时改 DB 记录 → 页面反映 → 还原,闭环确认真从 Neon 读取。

## C · 上线 Vercel
- scope `lukes-projects-e427a219`,项目 `lucid`。
- **踩坑 1**:Next 15.0.3 被 Vercel 漏洞门硬拦 → 升级 `next@15.5.18` + `react/react-dom@19.2.0`。
- **踩坑 2**:React 19 peer 冲突,Vercel `npm install` 失败 → 加 `.npmrc` `legacy-peer-deps=true`。
- **env**:`NEXT_PUBLIC_SITE_URL=https://lucid-zeta-indol.vercel.app`(production)。
- **生产 URL**:**https://lucid-zeta-indol.vercel.app** · 全路由 200 · 公开可访问 · DB 读取生效。

## 待办 / 用户侧
- `NEXT_PUBLIC_GA_ID`:用户在 Vercel production env 设 `G-XXXXXXXXXX` 后重部署即开 GA4(代码已就绪)。
- 收藏/admin 需 Clerk(目前 `x-user-id` stub)。
- 自定义域名:可在 Vercel 项目绑定。
- 补视频:YouTube 配额重置后冲 ≥27/30。

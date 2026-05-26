# 明读 / Lucid SEO + GEO 审计

站点：https://lucid.simprr.com（zh 主，en 辅）· Next.js App Router + next-intl + Vercel
审计日期：2026-05-26 · 范围：实际抓取首页 + 视频/人物/主题详情页 HTML

## 实测体检结论

好的一面：内容**服务端渲染**（视频页 H1「Andrej Karpathy:大语言模型入门一小时」、中文速读正文、YouTube 嵌入均在原始 HTML 中），AI 爬虫与搜索引擎能读到正文。`/` 307 跳 `/zh`，`/en` 200。
致命面：**所有页面（首页/视频/人物/主题）共用同一套 `<title>明读 · 把长内容读明白</title>` 和 description「把长内容读明白」**；全站 **0 个 JSON-LD**；**无 canonical、无 hreflang、robots.txt 404、sitemap.xml 404、llms.txt 404**。等于把一个内容质量不错的站，按「单页站」暴露给搜索/AI。

---

## Top 问题清单

### P0 — 致命，直接卡住收录与排名

**P0-1 每页元数据全部雷同**
- 技术：详情页未用 Next.js `generateMetadata` 输出动态 title/description。三种页型 title 全是「明读 · 把长内容读明白」。
- 内容：搜索结果标题/摘要无法体现页面主题，CTR 与相关性双输。
- 修复：每页 `generateMetadata` 动态化。视频页 title=「{中文标题} | {人物}访谈中文速读 - 明读」、description 取速读首段 110–150 字（含人名、主题词、「中文速读/摘要」）。人物页、主题页同理。

**P0-2 robots.txt / sitemap.xml 缺失（均 404）**
- 技术：`app/robots.ts`、`app/sitemap.ts` 未实现；alt 路径（sitemap-0、sitemap_index）也 404。
- 策略：搜索引擎与 AI 爬虫无索引入口，63 个 URL（46 视频+12 人物+5 主题）靠盲爬。
- 修复：生成 `sitemap.ts`（含 zh/en 双语 + `lastModified`），`robots.ts` 指向 sitemap 并放行主流 AI bot（GPTBot、PerplexityBot、Bytespider/豆包、ClaudeBot、Google-Extended）。

**P0-3 全站零结构化数据**
- 技术：无 Schema.org。这是被 Google 富结果与 AI 引用的最高杠杆项。
- 修复：视频页注入 `VideoObject`（name/description/thumbnailUrl/uploadDate/duration/embedUrl/transcript），人物页 `Person`（name/sameAs 指 Twitter/官网/维基）+ `BreadcrumbList`，主题页 `CollectionPage`，首页 `WebSite`+`SearchAction`。速读摘要可用 `Article`/`Clip` 标记关键观点。

### P1 — 高优，影响双语与可发现性

**P1-1 缺 hreflang + canonical**
- 技术：zh/en 互为译文却无 `hreflang` 与 `x-default`，无 canonical。
- 修复：`generateMetadata` 的 `alternates.languages` 输出 zh-CN/en + x-default，并设 self canonical，规避双语重复内容判定。

**P1-2 OG 全站同图同文**
- 技术：og:image 固定 `og-image.jpg`，分享视频/人物时无差异化预览。
- 修复：用 Next `opengraph-image` 动态生成（视频缩略图+中文标题，人物用漫画头像），提升社媒/IM 分享点击（中文内容靠微信/即刻/小红书传播尤甚）。

**P1-3 内容词缺乏长尾承接**
- 内容：H1 已带人名，但无显式锚定中文搜索意图的副标题/FAQ。
- 机会词：「Karpathy 演讲 中文」「Dario Amodei 访谈 解读」「AI Agent 是什么」「{人物} 最新观点」「英文播客 中文总结」。
- 修复：视频页加「一句话讲了什么」+ 3–5 条 `FAQPage` 问答（用速读关键观点改写成问句），正面命中问答式查询。

### P2 — 增量，GEO 引用率与体验

**P2-1 无 llms.txt（404）**
- 策略：缺 AI 爬虫导航清单。
- 修复：根 `llms.txt` 列站点定位 + 视频/人物/主题索引链接；可加 `llms-full.txt` 汇总全部速读纯文本，提高被 ChatGPT/Perplexity/Kimi/豆包检索命中率。

**P2-2 事实密度与可引用性**
- 策略：AI 引用偏好「带归属的离散事实」。当前速读偏叙述。
- 修复：关键观点改为可独立引用的短句（「{人物}认为：……」），时间线带 `HH:MM` 时间戳锚点 + 深链；末尾署「来源：{原视频} · 明读 AI 速读」强化品牌归属。

**P2-3 性能/移动信号**
- 技术：CSS 外链、SSR 体量合理（视频页 ~37KB HTML）；建议核查 LCP（首页 OG 图 1536×864 是否进首屏）、字体策略、YouTube 嵌入用 facade 懒加载降 CLS/JS。

---

## 执行顺序
P0-2（robots+sitemap）→ P0-1（动态 metadata）→ P0-3（JSON-LD）→ P1 全部 → P2。前三项是「能不能被收录/引用」的开关，一周内可全部由 `generateMetadata` + `sitemap.ts`/`robots.ts` 完成，无需改动内容架构。

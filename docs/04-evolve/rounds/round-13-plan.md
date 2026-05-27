# 巡检官 第 13 轮决策文档 — 明读 / Lucid

- **日期**: 2026-05-27
- **模式**: Sprint(维护 / Maintain) · 单人(老吴 solo · single-shot)
- **产品目标**: 把前沿长访谈/演讲读明白 —— AI 生成结构化中文速读,中英双语策展,GEO(被 AI 引用)是核心增长杠杆
- **产品地址**: https://lucid.simprr.com(custom domain · prod)
- **基线**: prod 健康(/ → /zh 200 · 0.95s)· 首页 46 视频 · sitemap 154 URL 双语 · OG/JSON-LD/canonical/hreflang 全在 · 上一轮 round-012 score 0.97

## 态势简报

| 维度 | 实测 | 结论 |
|------|------|------|
| 生产可达 | / → 307 → /zh → 200 (0.95s) | ✅ |
| 首页内容 | 46 视频链接 | ✅ |
| sitemap | 154 `<loc>` · 双语 hreflang · 276 video/138 people/30 topic 互译声明 | ✅(早期"只 4 URL"系冷启截断误读,实况健康) |
| SEO meta | OG 全套 + JSON-LD(Person+VideoObject)+ canonical + alternate | ✅ |
| llms.txt | 200 · 但内容陈旧 | ⚠️ **C1** |
| 人物数据 | shunyu-yao(姚顺雨)/ yao-shunyu(姚顺宇)同音近镜像 slug | ⚠️ **C2** |
| tsc 独立 | TS6046/TS5070(bundler 解析)| 已知 W4 · Next build 自带过 · 非阻塞 |
| git | clean(仅 .gitignore + 未跟踪 backfill-avatars.ts) | — |

## 候选改进

| # | 优先级 | fix_type | 描述 | 处置 |
|---|--------|----------|------|------|
| C1 | P1 | GENERAL | `public/llms.txt` 仍把明读定位为"英文深度长访谈"、只列 12 位海外人物;产品已转中英双语、新增 10+ 华语 AI 人物(李开复/杨植麟/印奇/姚顺雨/罗福莉/谢赛宁/谭捷/季逸超/高继扬/张鹏)。AI 爬虫读 llms.txt 会判定明读不覆盖华语 AI 生态 → 漏掉一整类引用查询。 | ✅ 本轮修(改写静态 llms.txt 为双语准确版) |
| C2 | — | (FALSE POSITIVE) | 初判 `shunyu-yao`(姚顺雨)/`yao-shunyu`(姚顺宇)同音近镜像 slug 疑似重复人物。**查 memory 013o/013s 澄清:二者是两个不同真人,管线入库时 DeepSeek 已主动识别并标注"姚顺宇 ≠ 腾讯姚顺雨",Alan 刻意分开保留。非 bug。** | ✗ 撤销 — 经记忆核验为误报,不修不延迟 |

### Anti-Overfitting 检查
- C1:"若这条具体陈旧消失,改动仍有价值吗?" → 是。准确的双语+人物覆盖让 GEO 引用面覆盖一整类华语查询,非单点。**GENERAL**。
  - 更彻底的 GENERAL 方案 = llms.txt 改为 route handler 从 DB 动态生成(随内容增长不再陈旧)。但描述/引用指引含编辑性文案,不宜全自动生成,且静态文件 shadow 路由需处理 → **本轮取最小高价值改动(静态准确化),"动态 llms.txt"记为未来轮 deferred GENERAL**。

## 修复计划表

| 行 | 项 | 文件 | 状态 |
|----|----|------|------|
| 1 | C1 改写 llms.txt 为中英双语准确版 + 华语人物 + 双站路径 + 来源(张小珺商业访谈录) | `app/public/llms.txt` | ✅ |

## 延迟表
- [ ] 延迟(GENERAL):llms.txt 改为动态 route handler 从 DB 拉人物/主题,杜绝陈旧复发

## 误报记录(trust-but-verify)
- C2 姚顺雨/姚顺宇"疑似重复" → **误报**。memory 013o/013s 已记录二者为不同真人(管线入库 DeepSeek 主动澄清 ≠),无需处理。
- 早期"sitemap 只 4 URL" → **误报**。系 RTK/curl 管道冷启截断(memory 013j 已记此坑:验线上计数要 python/Read 绕过)。capture-then-grep 实测 154 URL 双语,健康。
- [ ] 既有 post-launch TODO:13 个 _DRAFT 视频回填 / Clerk 替 x-user-id stub(W5)/ 25 LLM eval 真测(≥85% 北极星)

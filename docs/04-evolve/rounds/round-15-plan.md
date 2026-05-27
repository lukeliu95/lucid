# 巡检官 第 15 轮决策文档 — 明读 / Lucid

- **日期**: 2026-05-27
- **模式**: Sprint(维护)· 浏览器实访「查看体验」loop
- **本轮重点**: 搜索流程 + 交互 + 空状态(首页/详情/人物已在 round-13/14 覆盖,本轮转搜索面)

## 巡检(浏览器实访 · prod)
| 面 | 观察 |
|----|------|
| 移动端 390px | resize_window 报成功但截图仍 1568 宽 → Chrome 不渲染低于最小窗宽,**本工具无法真机验移动端**(013m 已记)→ 移动端修改无法可视验证,本轮跳过,记延迟 |
| 搜索流程 | `?q=` 带查询时结果正常(共 N 条 + 关键词/语义 toggle + 视频/人物/主题分区) |
| 搜索空状态 /search(无 q) | **白屏**:只有"搜索"标题 + 一行小字 + 一大片空白,无任何探索入口 ← C1 |
| 搜索人物结果 | 人物头像写死空渐变圆圈,**从不渲染真实头像** ← C2 |

## 候选 + 处置
| # | 优先级 | 描述 | 处置 |
|---|--------|------|------|
| C1 | P1 GENERAL | /search 空查询=白屏,⌘K 是显眼入口但落地无可逛 | ✅ 修:重做为探索面(热门主题 chips + 人物墙复用 PersonRail) |
| C2 | P2 GENERAL | 人物搜索结果头像永远空圆圈(`search/page.tsx` 写死渐变 div) | ✅ 修:渲染真实 avatar_url + fallback,复用站内 img 模式 |
| (排除) | — | "回车搜索没反应" | 假阳性:`search-bar.tsx` `<form onSubmit→router.push>` 正确,是自动化 computer.type 没驱动 React 受控 input;form_input 正确驱动后 Enter→/search?q= 正常 |
| (不碰) | — | 某 Lex Fridman 视频搜索结果封面空 | 内容数据缺口(该视频缺 cover_url),按约定不碰内容管线 |

### Anti-Overfitting
- C1/C2 均 GENERAL:空状态探索面服务所有"还没想好搜什么"的读者;头像渲染对所有人物结果生效。非单点。

## 修复计划表
| 行 | 项 | 文件 | 状态 |
|----|----|------|------|
| 1 | 空状态重做:getTopics+getAllPeople,渲染主题 chips + PersonRail 人物墙 | `app/src/app/[locale]/search/page.tsx` | ✅ |
| 2 | 人物搜索结果渲染真实头像 + fallback | 同上 | ✅ |
| 3 | i18n key `search.explore_hint` 双语 | `app/messages/{zh,en}.json` | ✅ |

## 验证(证据)
- `next build` ✓ Compiled successfully,16/16 页,search 路由构建,无类型错误
- **prod 实访**:① /zh/search 空状态 = "搜索" + 探索提示 + 5 主题 chips + 23 人物墙(头像全载),白屏消失 ② /zh/search?q=Karpathy 人物结果 Andrej Karpathy 显示**真实漫画头像**(原空圆圈)

## 上线
- boss 确认"上线" → `vercel --prod`(deploy lucid-3ykb61pml · aliased lucid.simprr.com)

## 延迟表
- [ ] 移动端 390px 体验巡检:claude-in-chrome resize 无法渲染真机宽度;需 devtools 移动模拟或真机,留后续轮/换工具
- [ ] Lex Fridman「未来工作」等视频缺 cover_url(内容数据,非本 loop 范围,转 Alan 内容运营)
- [ ] 空状态人物墙现展示全部 23 人,后续可考虑"热门/最新"排序或限量

# UI Brief · kdsj-world

> Phase B.1 UI Track 主 prompt 素材 · 供 Mia(设计)和小赵(前端)。
> project_type = hybrid · 桌面 web 优先 · 中英双语 MVP 强制。

---

## 1. 项目快照

| 项 | 值 |
|---|---|
| 工作名 | kdsj-world(看懂世界) |
| 上线截止 | 2026-05-31 |
| 技术栈 | Next.js 15 App Router + shadcn/ui + Tailwind + next-intl + Vercel |
| 部署 | Vercel · 域名 `kdsj-world.vercel.app` 或 Simprr 自有域名 |
| 字体 | 中文 思源 / 系统楷;英文 Inter / Geist · 衬线优先(承载"读懂"语义) |
| 主体色 | 深灰墨 + 暖橘高亮(待 Mia 落锤 · 见 §3 视觉参考) |
| 移动端 | MVP **不做**响应式 · v1.1+ |
| Auth | NextAuth(免费 · Google + Email)候选 · 老周裁 |

---

## 2. 信息架构 · 4 主页面 + 1 后台

```
/                       — 首页(精选视频 grid + 主题条 + 人物条)
/v/[slug]               — 视频详情页(核心 · 占 60% 体验权重)
/p/[slug]               — 人物页
/t/[slug]               — 主题页(5 个: ai / ai-agent / startup / chip / future-of-work)
/search?q=...           — 搜索结果
/me                     — 个人主页(收藏)
/login                  — 登录
/admin                  — 后台(视频 CRUD + AI 状态 + 摘要校对)
/[locale]/...           — 全部路由都有 zh / en 两套
```

---

## 3. 视觉参考(供 Mia 选)

候选(Alan 不强求 · Mia 落锤):

- **electronic-magazine + eink 混合**(衬线 · 流体背景 · 暖橘高亮) — 与"读懂世界"调性吻合 ⭐
- **swiss international(Helvetica + 网格 + IKB / 柠檬黄高亮)** — 偏理性 · 与 AI/科技调性吻合 ⭐
- electronic 杂志风(更强烈封面感)
- 候选 design-library: `design-library/voltagent` / `design-library/cohere`(简洁理性) / `design-library/composio`

Alan 偏好(从 intent-brief 推): "两分钟读懂"= 信息密度 + 留白 + 清晰层级,**避免花哨**。

---

## 4. 关键组件清单

| 组件 | 用于 | 优先级 |
|---|---|---|
| `LocaleToggle` | 全局 header | P0 |
| `VideoCard` | 首页 / 主题页 / 人物页 / 收藏页 | P0 |
| `VideoEmbedPlayer` | 视频详情页 | P0 |
| `SummaryBlock` | 一句话总结 + 大字 | P0 |
| `KeypointsList` | 5-10 条 bullet · hover 显示原文锚点 | P0 |
| `TimelineNav` | ≥ 5 节点 · 点击跳秒 | P0 |
| `TwoTierTabs` | 成人速懂 / 深度版 tab | P0 |
| `SourceCitation` | 元信息 + 外链 | P0 |
| `TopicStrip` | 5 主题胶囊 | P0 |
| `PersonAvatarRail` | 人物头像横条 | P1 |
| `SearchBar` | 全局顶部 / `/search` | P0 |
| `FavoriteButton` | 视频详情 + 卡片 hover | P0 |
| `AuthForm` | `/login` | P0 |
| `AdminVideoForm` | `/admin` | P0 |
| `AdminStatusTable` | `/admin` | P0 |
| `Footer` | 全站 · 含 `https://x.com/simprr` | P0 |

---

## 5. 关键 User Journey(5 条)

1. **Alan 早上 5 分钟扫**: `/` → 看 grid → 点最关心一条 → `/v/...` → 看一句话 + 5 观点 → 关闭
2. **中文圈层访客**: 朋友圈 → `/v/[slug]` → 切 zh → 读深度版 → 点心收藏(触发 `/login`)
3. **Twitter 用户**: @simprr 链接 → `/v/[slug]` → 切 en → 看时间轴 → 跳秒到关键段 → 点原视频外链
4. **运营(Alan)入新片**: `/admin` → 表单粘 YouTube URL + 嘉宾 + 主题 → 提交 → 实时看 ASR / 摘要状态 → ai_done 后前台立刻可见
5. **关键词搜索**: 顶部搜索 "agent" → `/search?q=agent` → 看到关键词 + 语义双路结果 → 点入

---

## 6. 硬约束(必须遵守)

- ✅ Footer 全站可见 · 含 `https://x.com/simprr` 链接 · 双语版权字
- ✅ 视频详情页所有 AI 产出字段双语切换 0 缺漏
- ✅ Lighthouse: Perf ≥ 80 / A11y ≥ 90 / BP ≥ 90 / SEO ≥ 90
- ✅ a11y critical = 0(axe-core)
- ❌ 不做移动响应式(width < 768 提示"建议桌面访问")
- ❌ 不做暗黑模式(MVP 砍 · v1.1+)
- ❌ 不做用户提交链接的 UI(MVP 砍)

---

## 7. Stack Confirmation(锁定)

| 层 | 选择 | 备注 |
|---|---|---|
| Framework | Next.js 15 App Router | 已锁 |
| UI Lib | shadcn/ui + Tailwind | 已锁 |
| i18n | next-intl | 已锁 |
| Auth | NextAuth(候选) / Clerk(候选) | 老周 Phase B 入口前裁 |
| ORM/DB | Drizzle(候选) / Prisma(候选)+ Neon Postgres + pgvector | 老周裁 |
| Deploy | Vercel | 已锁 |
| Analytics | Vercel Analytics | 已锁 |
| LLM | DeepSeek-v4-pro · Edge Function 代理 | 已锁 |
| ASR | Whisper local · 运营机器 | 已锁 |

---

## 8. design-handoff 期望交付(Mia → 小赵)

- `docs/02-design/design-spec.md`(信息架构 + 4 页 layout 决定 + 关键组件规格)
- `docs/02-design/tokens.json`(主色 / 间距 / radius / 字号 typescale)
- `docs/02-design/i18n-keys.md`(UI key 中英对照表 · 供 next-intl 翻译)
- 高保真图(首页 + 视频详情 + 主题页 + 人物页 · 桌面 1440)
- 可选: Figma frame link

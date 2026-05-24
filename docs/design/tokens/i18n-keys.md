# i18n Keys · zh / en 双语对照

> next-intl messages 文件源 · 100% 覆盖 UI 文案 · 内容字段(摘要/观点/解释)走 DB `_zh` / `_en` 列不入此表

## 文件位置约定

- `messages/zh.json` · `messages/en.json` · 与 `next-intl` `[locale]` segment 路由对齐

---

## 1. Global / Common(`common.*`)

| key | zh | en |
|---|---|---|
| common.brand_name | 看懂世界 | kdsj |
| common.brand_tagline | 把长访谈变成两分钟读懂 | Long talks, two-minute reads |
| common.locale_zh | 中文 | Chinese |
| common.locale_en | English | English |
| common.search_placeholder | 搜索视频、人物、主题 | Search videos, people, topics |
| common.search_shortcut_hint | ⌘ K | ⌘ K |
| common.read_more | 阅读全文 | Read more |
| common.back_to_home | ← 返回 首页 | ← Back to home |
| common.share | 分享 | Share |
| common.loading | 加载中… | Loading… |
| common.error | 出错了 · 重试 | Something went wrong · Retry |
| common.empty | 暂无内容 | Nothing here yet |
| common.coming_soon | 处理中 | Processing |
| common.try_again | 重试 | Try again |
| common.see_all | 查看全部 | See all |
| common.minutes | 分钟 | min |
| common.hours | 小时 | hour |

## 2. Header / Nav(`nav.*`)

| key | zh | en |
|---|---|---|
| nav.home | 首页 | Home |
| nav.topics | 主题 | Topics |
| nav.people | 人物 | People |
| nav.search | 搜索 | Search |
| nav.login | 登录 | Sign in |
| nav.logout | 退出登录 | Sign out |
| nav.my_favorites | 我的收藏 | My favorites |
| nav.admin | 后台 | Admin |
| nav.locale_toggle_aria | 切换语言 | Switch language |

## 3. Home(`home.*`)

| key | zh | en |
|---|---|---|
| home.hero.label | 今日精读 | Today's read |
| home.hero.cta | 阅读全文 → | Read full → |
| home.section.topics | 主题 | Topics |
| home.section.people | 人物 | People |
| home.section.latest | 最新精选 | Latest curated |
| home.load_more | 加载更多 | Load more |
| home.empty_grid | 内容正在导入中 | Content is being curated |

## 4. Video Detail(`video.*`)

| key | zh | en |
|---|---|---|
| video.summary.label | 一句话总结 | One-sentence summary |
| video.keypoints.label | 核心观点 | Key points |
| video.keypoints.hint_hover | 悬停查看原文锚点 · 点击跳秒 | Hover for source · click to seek |
| video.tier.quick | 成人速懂 | Quick read |
| video.tier.deep | 深度版 | Deep dive |
| video.timeline.label | 时间轴 | Timeline |
| video.source.label | 来源 | Source |
| video.source.original_link | 在 {platform} 看原片 ↗ | Watch on {platform} ↗ |
| video.related.people | 相关人物 | Related people |
| video.related.topics | 相关主题 | Related topics |
| video.favorite.add | 收藏 | Favorite |
| video.favorite.added | 已收藏 | Favorited |
| video.favorite.login_hint | 登录后可收藏 | Sign in to favorite |
| video.ai_status.pending | AI 处理中 · 仅播放器可见 | AI processing · player only |
| video.ai_status.failed | AI 处理失败 · 已通知运营 | AI processing failed · ops notified |
| video.skip_to_summary | 跳过播放器到摘要 | Skip to summary |

## 5. Person(`person.*`)

| key | zh | en |
|---|---|---|
| person.bio | 简介 | Bio |
| person.signature_views | 代表观点 | Signature views |
| person.related_videos | 相关视频 | Related videos |
| person.signature_views.generating | 代表观点生成中 | Generating signature views |
| person.no_videos | 尚无 demo 视频 | No demo videos yet |
| person.cite_prefix | 引自 | from |

## 6. Topic(`topic.*`)

| key | zh | en |
|---|---|---|
| topic.intro | 主题简介 | About this topic |
| topic.videos_count | {count} 期视频 | {count} videos |
| topic.related_people | 关键嘉宾 | Key guests |
| topic.slug.ai | AI | AI |
| topic.slug.ai-agent | AI Agent | AI Agent |
| topic.slug.startup | 创业 | Startup |
| topic.slug.chip | 芯片 | Chip |
| topic.slug.future-of-work | 未来工作 | Future of Work |

## 7. Search(`search.*`)

| key | zh | en |
|---|---|---|
| search.title | 搜索 "{query}" | Search "{query}" |
| search.count | 共 {count} 条 | {count} results |
| search.mode.keyword | 关键词 | Keyword |
| search.mode.semantic | 语义 | Semantic |
| search.section.videos | 视频 | Videos |
| search.section.people | 人物 | People |
| search.section.topics | 主题 | Topics |
| search.empty | 没找到 "{query}" 相关内容 | No results for "{query}" |
| search.empty.suggest | 试试热门主题: | Try a popular topic: |

## 8. Auth(`auth.*`)

| key | zh | en |
|---|---|---|
| auth.signin.title | 登录 | Sign in |
| auth.signin.continue_google | 用 Google 继续 | Continue with Google |
| auth.signin.continue_email | 用邮箱继续 | Continue with email |
| auth.signin.email_placeholder | 邮箱地址 | Email address |
| auth.signin.submit | 发送登录链接 | Send magic link |
| auth.signin.terms | 登录即同意 服务条款 与 隐私政策 | By signing in you agree to Terms and Privacy |
| auth.signin.redirect_hint | 登录后将回到原页面 | We'll bring you back to where you were |

## 9. My / Favorites(`me.*`)

| key | zh | en |
|---|---|---|
| me.title | 我的 | My space |
| me.favorites.title | 我的收藏 | My favorites |
| me.favorites.empty | 还没有收藏 · 去 首页 逛逛 | Nothing favorited yet · explore Home |
| me.favorites.count | {count} 个收藏 | {count} favorites |

## 10. Admin(`admin.*`)

| key | zh | en |
|---|---|---|
| admin.title | 后台 | Admin |
| admin.video.new | 添加视频 | New video |
| admin.video.url_label | 视频 URL | Video URL |
| admin.video.url_placeholder | https://www.youtube.com/watch?v=... | https://www.youtube.com/watch?v=... |
| admin.video.platform | 平台 | Platform |
| admin.video.person | 嘉宾 | Guest |
| admin.video.topics | 主题 | Topics |
| admin.video.submit | 提交并处理 | Submit & process |
| admin.video.submitting | 处理中… | Processing… |
| admin.status.pending | 待处理 | Pending |
| admin.status.asr_done | ASR 完成 | ASR done |
| admin.status.ai_done | AI 完成 | AI done |
| admin.status.failed | 失败 | Failed |
| admin.review.edit | 校对编辑 | Review & edit |
| admin.review.save | 保存 | Save |
| admin.review.saved | 已保存 | Saved |

## 11. Footer(`footer.*`)

| key | zh | en |
|---|---|---|
| footer.copyright | © 2026 看懂世界 · 由 Simprr 策划 | © 2026 kdsj-world · curated by Simprr |
| footer.author_link | x.com/simprr | x.com/simprr |
| footer.about | 关于 | About |
| footer.privacy | 隐私 | Privacy |
| footer.terms | 条款 | Terms |
| footer.tagline | 长内容的解释器与入口 | Explainer and gateway to long-form |

## 12. A11y / ARIA(`a11y.*`)

| key | zh | en |
|---|---|---|
| a11y.skip_to_main | 跳到主内容 | Skip to main content |
| a11y.player_label | 视频播放器 | Video player |
| a11y.tabs_label | 解释深度 | Explanation depth |
| a11y.timeline_label | 视频时间轴导航 | Video timeline navigation |
| a11y.search_results_live | 已找到 {count} 条结果 | {count} results found |

---

## 计数

- 章节: 12
- key 总数: **~110**
- 占位符变量: `{count}` `{query}` `{platform}`

## 验收

- [ ] `messages/zh.json` + `messages/en.json` 两个文件 key 完全镜像(对称)
- [ ] eval 跑 `i18n-key-coverage`:无 missing key fallback
- [ ] 切换语言 layout shift = 0(给标题容器固定 min-height)
- [ ] 命名规范: `{namespace}.{section}.{name}` · snake_case 不用驼峰

# High-Fidelity Mockups · kdsj-world

4 个 HTML 静态稿 · 桌面 1440 · Mia 直接交给小赵照像素实现。

| 文件 | 页面 | 关键点 |
|---|---|---|
| `home.html` | 首页 `/` | Hero 一句话 + TopicStrip + PersonRail + VideoCard grid + Footer |
| `video-detail.html` | 详情 `/v/[slug]` | 主+侧栏 · iframe player + summary + keypoints + TwoTierTabs · sticky TimelineNav |
| `person.html` | 人物 `/p/[slug]` | Avatar + bio + signature views + related videos |
| `search.html` | 搜索 `/search` | 三段堆叠 · `<mark>` 高亮 · toggle keyword/semantic |

## 用法

1. 浏览器直接打开 `home.html` 等(无 build)看视觉
2. 小赵实现时:**字号 / 间距 / 颜色 / 字体** 必须照稿(已用 design-tokens 变量,grep 验证无 hardcode)
3. 内容只是 lorem · 实际数据由小赵接 API

## 字体

为简化在线预览,mockup 用系统衬线 fallback。生产用 `next/font` 加载 Source Serif Pro + Source Han Serif SC。

## 与 wireframes 对齐

每个 mockup 严格对应 `wireframes/0X-*.md`。组件标号(C01-C16)直接 inline 注释。

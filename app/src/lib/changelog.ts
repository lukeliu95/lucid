// 明读 build-in-public 更新日志 —— 这页是对外内容的 canonical 源,
// 其他平台(即刻/小红书/知乎)的帖子引用 lucid.simprr.com/zh/changelog。
// 追加新条目:往 entries 数组顶部加一项(保持时间倒序)。

export type ChangelogEntry = {
  /** YYYY-MM-DD */
  date: string;
  /** 短标签,如 "上线" / "优化" / "内容" */
  tag_zh: string;
  tag_en: string;
  title_zh: string;
  title_en: string;
  /** 正文段落数组(每项一段),支持空行分段 */
  body_zh: string[];
  body_en: string[];
  /** 可选:站内配图(放 public/changelog/ 下,这里写 /changelog/xxx.png) */
  image?: string;
  /** 可选:相关视频 slug,渲染成"看个例子"链接 */
  video_slug?: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-05-26",
    tag_zh: "优化",
    tag_en: "Polish",
    title_zh: "好内容,死在分享那一刻",
    title_en: "Good content dies the moment you share it",
    body_zh: [
      "我发现个事:好内容,死在分享那一刻。",
      "你把一篇速读甩进群里,微信、即刻给你抓张灰扑扑的默认图,再好的东西,长得像垃圾链接,没人点。",
      "所以我给明读每个页面都「长」了一张卡——你分享任何一篇速读,链接自动变成带标题、带这期核心观点、带人物的品牌卡片。",
      "技术上是动态生成的,还踩了个中文字体的坑(默认渲染全是豆腐块),用按需子集化的字体治好了。",
      "包装,也是内容的一部分。",
    ],
    body_en: [
      "Here's the thing I noticed: good content dies the moment you share it.",
      "Drop a read into a group chat and the platform grabs a dull default thumbnail. The best content ends up looking like spam — nobody clicks.",
      "So every page on Lucid now grows its own card. Share any read and the link auto-renders a branded card with the title, the core takeaway, and the speaker.",
      "It's generated on the fly, and I hit a CJK font trap along the way (everything rendered as tofu boxes) — fixed with on-demand font subsetting.",
      "Packaging is part of the content.",
    ],
    image: "/changelog/og-card-demo.png",
    video_slug: "karpathy-agent-architecture",
  },
  {
    date: "2026-05-25",
    tag_zh: "基建",
    tag_en: "Infra",
    title_zh: "让明读「被读懂」",
    title_en: "Making Lucid legible to machines",
    body_zh: [
      "今天干的是个看不见但要命的活:让明读「被读懂」——被搜索引擎读懂,也被 AI 读懂。",
      "结构化数据、双语 sitemap、hreflang、给爬虫的 llms.txt,一套铺下去。现在你问 AI「Karpathy 怎么看 AGI」,它有机会引到明读。",
      "内容做得再好,搜不到、被引不到,等于没做。",
    ],
    body_en: [
      "Today's work is invisible but critical: making Lucid legible — to search engines, and to AI.",
      "Structured data, a bilingual sitemap, hreflang, an llms.txt for crawlers. Now when you ask an AI \"what does Karpathy think about AGI,\" it has a shot at citing Lucid.",
      "However good the content is, if it can't be found or cited, it doesn't exist.",
    ],
  },
  {
    date: "2026-05-25",
    tag_zh: "内容",
    tag_en: "Content",
    title_zh: "漫画脸 + 大白话",
    title_en: "Comic faces + plain talk",
    body_zh: [
      "给每位嘉宾画了漫画头像——统一的插画风,暖米色底,一眼认得出是谁,又不端着。",
      "速读也换了脾气:不再是翻译腔的「该访谈探讨了……」,而是大白话——他到底说了啥、为什么重要,人话讲清楚。",
      "看懂,比看全更重要。",
    ],
    body_en: [
      "Drew comic-style avatars for every speaker — one consistent illustration style, warm cream background, instantly recognizable without the stiffness.",
      "The reads got a new attitude too: no more translation-ese (\"This interview explores...\"). Just plain talk — what they actually said and why it matters, in human language.",
      "Understanding beats completeness.",
    ],
  },
  {
    date: "2026-05-24",
    tag_zh: "上线",
    tag_en: "Launch",
    title_zh: "5 小时访谈,5 分钟读懂",
    title_en: "5-hour interview, read in 5 minutes",
    body_zh: [
      "明读上线了。",
      "起点是个长期的别扭:好的英文长访谈,一期三五个小时,信息密度极高,但我永远看不完。逐句翻译不是读懂——读懂是有人替你把它嚼碎、理出脉络、用你的母语讲明白。",
      "所以明读做的不是字幕,是「速读」:核心观点、时间线、人话版解释。配上 Google 登录和收藏,看过的、想留的,都在「我的」里。",
      "5 小时的英文,5 分钟的中文。",
    ],
    body_en: [
      "Lucid is live.",
      "It started from a long-standing itch: great English long-form interviews run three to five hours, dense with insight — and I never finish them. Sentence-by-sentence translation isn't understanding. Understanding is someone chewing it down, mapping the thread, and explaining it in your own language.",
      "So Lucid doesn't do subtitles — it does \"reads\": core takeaways, a timeline, a plain-language explainer. Plus Google sign-in and favorites, so what you've watched and want to keep lives in \"My Library.\"",
      "Five hours of English, five minutes of Chinese.",
    ],
  },
];

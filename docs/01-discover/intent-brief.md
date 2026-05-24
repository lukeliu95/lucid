# Intent Brief · kdsj-world(看懂世界)

> Alan Intake Dialogue 产物 · 2026-05-24
> 项目代号: `kdsj-world` · output_dir: `~/gei-workspace/output/kdsj-world`
> 客户: Simprr(Alan 本人 · 路径 A 自用产品)· 署名 `x.com/simprr`

---

## 1. Primary Goal

> **用 AI 把"长得没人看完"的高密度视频(访谈/播客/演讲/纪录片),变成"两分钟就懂大概"的结构化知识卡。**

不是视频聚合站,是"长内容的解释器 + 入口"。

MVP 阶段切口锁死 **AI / 科技 / 商业人物访谈**(英文原片为主 → 中英双语摘要)。

成立条件:
1. Alan 自己每天会用(Cooper · 第一用户)
2. 朋友圈 / Twitter(@simprr · 38 字范围)能转发并产生点击
3. 30 条 demo 视频在站,每条都能"两分钟看懂"

---

## 2. Secondary Goals

- 中文圈层入口(英文原片 → 中文摘要,降低华语听众消费门槛)
- 双语切换 UI(英文用户也能用)
- 内容池可持续:运营手动灌片优先,v1.1+ 开放用户提交
- 长期承载 Alan 个人 Twitter 影响力建设(footer 留 simprr 链接)

---

## 3. 砍掉的伪需求(Musk 第一性 · 已确认)

| # | 原 PRD 要求 | MVP 决定 | 理由 |
|---|---|---|---|
| K1 | 分层解释 5 档(小学/初中/成人/深度/专家) | **2 档**(成人速懂 + 深度版) | 5 档 ≈ 配色选择,验证不了任何核心假设;LLM 调用 ×5 不划算 |
| K2 | 用户提交链接 + 异步处理队列 | **MVP 砍** · v1.1+ | 第一版先验证"内容好不好看",而不是做调度系统;运营人工预录入 30 条 |
| K3 | 复杂推荐系统 | **编辑精选 + 时间排序** | 1k DAU 前没数据可推 |
| K4 | 7 个产品名候选 + 移动端响应式 | 工作名锁 `kdsj-world` · 桌面 web 优先 | 命名是营销层 / 移动响应式 v1.1+ |
| K5 | 内容覆盖历史/战争/心理/社会/教育/经济 全领域 | **MVP 只做 AI/科技/商业访谈** | 边界过宽稀释定位;6 月之后再扩 |
| K6 | 1000 视频 / 100 人物 / 20 主题 | **30 视频 / 10 人物 / 5 主题** | 本月 7 天上线 + 双语 + 1000 视频 = 物理不可能;30 条够 demo |
| K7 | 完整后台(8 模块) | **MVP 极简后台**(视频 CRUD + AI 状态查看) | 推荐位 / 用户审核 / 数据看板都是 v1.1+ |
| K8 | 知识图谱 / 学习路径 / 观点对比 | **v2.0 范围**(PRD 自己定的 Phase 3) | MVP 不碰 |

---

## 4. 硬约束

| 约束 | 值 | 备注 |
|---|---|---|
| 上线截止 | **本月 5-31 之前**(7 天) | Vercel prod 域名可访问 · 30 demo 视频在站 · Twitter 发链接 |
| 双语 | **MVP 必须双语**(UI + 内容摘要双版) | 用户明确要求;LLM 调用翻倍接受 |
| LLM | **DeepSeek-v4-pro 唯一**(用户指定) | 沿用 bazi-studio Edge Function 架构,key 仅服务端 |
| ASR | **本地 Whisper**(无字幕兜底) | 不进 LLM 预算;运营机器本地跑 |
| 技术栈倾向 | Next.js 15 App Router + shadcn + Vercel + Neon Postgres + pgvector | 由老周(qualify · Phase A 后半)最终落锤 |
| 署名 | Simprr · footer 含 `https://x.com/simprr` | 全站每页可见 |
| 版权红线 | 不下载搬运原视频 · 嵌入或外链 YouTube/Bilibili · 保留原作者/频道/平台/链接 | PRD §12.4 已写入 |
| 预算 | DeepSeek 走 Alan SaaS 账单(沿用 bazi-studio key)· 30 视频 × 双语 × 全栈处理 ≤ $10 测算 | 30 条规模可控 |

---

## 5. 钉死的 P0(用户已答)

| # | 问题 | 答案 |
|---|---|---|
| P0-1 | 种子用户从哪来? | Alan 自己 + 朋友圈 + Twitter(@simprr) |
| P0-2 | 内容字幕来源? | 优先 YouTube/平台公开字幕;无字幕走**本地 Whisper ASR** |
| P0-3 | LLM 预算 + 选型? | **DeepSeek-v4-pro 唯一**;30 视频规模 < $10/月 |
| P0-4 | Alan 自己是用户吗? | **是 · 优先满足自己需求**(Cooper 第一性) |
| P0-5 | 双语范围? | **MVP 必须 UI + 内容摘要双版**(英语为母语原片 + 中文摘要 + 英文摘要) |

---

## 6. 验收草稿(MVP · 5-31 前)

### 6.1 功能验收(刚性)

- [ ] Vercel prod 域名能访问(目标域: `kdsj-world.vercel.app` 或 Alan 自有域名 · 待定)
- [ ] 首页展示精选 30 视频(编辑精选 · 时间倒序)
- [ ] 视频详情页含:嵌入播放器 + 一句话总结 + 核心观点(5-10 条)+ 时间轴(≥5 节点)+ 2 档解释(成人速懂 / 深度)
- [ ] 视频详情页双语切换(中 ↔ 英)无内容缺失
- [ ] 人物页 10 位(头像 + 简介 + 代表观点 + 相关视频)
- [ ] 主题页 5 个(AI / AI Agent / 创业 / 芯片 / 未来工作)
- [ ] 关键词搜索(标题 / 人物 / 主题)+ 简易语义搜索(pgvector top-k)
- [ ] 收藏(登录态)+ 个人主页
- [ ] Footer 双语 + Simprr 链接

### 6.2 质量验收(Phase C · 阿May)

- [ ] 摘要准确率 ≥ 85%(20 case 人工抽检)
- [ ] 幻觉率 ≤ 5%(无来源虚构比例)
- [ ] 时间轴可用率 ≥ 80%(分段合理性人工评)
- [ ] UI 双语切换 100% 无缺漏(eval i18n key coverage)
- [ ] a11y critical = 0(axe-core)
- [ ] Lighthouse Perf ≥ 80 / A11y ≥ 90 / Best Practices ≥ 90 / SEO ≥ 90

### 6.3 上线 Day-1 北极星(传播验收)

- [ ] Alan 在 Twitter @simprr 发首条上线推文,链接可点
- [ ] 朋友圈第一波 ≥ 10 个真实点击(Vercel Analytics 验)
- [ ] Alan 自己一周内打开 ≥ 5 次(自用第一性)

---

## 7. 派活预案(Alan 已锁)

```
Phase A   小灰  → 25 章 PRD 压成 6 模块需求规格 + 30 视频 demo 选片清单 + 类型分流
Phase A   老周  → project_type = hybrid 锁定 + 技术栈深判(stack v1)
Phase B.0 Mia   → 4 大页面设计 + design tokens + i18n token + Stage E 双轨评审
Phase B.1 小赵  → Next.js 15 前端照稿实现 + i18n 中英(next-intl)
Phase B.2 大刘  → Edge Function (DeepSeek 代理) + ASR 流水线 + pgvector + 30 视频处理
Phase C   阿May → eval(摘要 / 幻觉 / i18n / a11y / Lighthouse) + 稳定性 gate
Phase D   老吴  → 上线后巡检(SEO / 性能 / 版权 / 内容池扩充)— 可选
```

并行机会:
- B.1 小赵 + B.2 大刘 全程并行(Mia handoff 落地后)
- 内容侧 30 demo 视频选片可与 B.1/B.2 工程并行(运营层)

---

## 8. 附录 · 用户原话(Intake 实录)

### Round 1(用户)

> "我要做一个新项目:《看懂世界》PRD(完整 25 章)"

### Round 2(Alan opening)

钉了 4 个 P0 + 砍 4 条 + 派活预案 + output_dir 提案

### Round 3(用户答 P0)

> "从朋友圈+twitter开始. 没有字幕则需要通过语音识别,可以用本地 asr 获取. LLM 使用 deepseek的最新模型deepseek-v4-pro,足够使用了. 我自己就是用户,优先满足我的需求. 产品名叫 kdsj-world 非常好. 本月要上线,必须双语. 产品最后署名是 SImprr, 留下链接https://x.com/simprr"

### Round 4(Alan push-back)

推翻"本月上线 + 1000 视频 + 双语全栈"三件事同时成立 → 内容池砍到 30 视频。

### Round 5(用户最终)

> "mvp 就需要双语"

→ 最终锁单:**30 视频 + UI 双语 + 内容摘要双版 + 5-31 上线**。

---

**Intake 收口 · 总 5 回合 · 进入 Phase A**

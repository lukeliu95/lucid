# 上线后检查清单 · 24h / 7 天

## T+1h(部署完立刻)

- [ ] 浏览器打开 `https://kdsj.world`,首页 30 视频卡片正常显示
- [ ] 随机点 3 个视频详情页,摘要 / 关键点 / 时间轴都有内容(不是 "ai_status=pending" 空状态)
- [ ] `/search?q=AGI` 返回 ≥ 3 个结果
- [ ] 双语切换无白屏 / 缺翻译
- [ ] Vercel logs 无 5xx 报错堆积

## T+24h

- [ ] 跑完 25 cases LLM eval(见 `llm-eval-execution-plan.md`)· 结果 ≥ 85%
- [ ] Vercel Analytics:首页 LCP < 2.5s
- [ ] OpenAI 账单 < $1(若已超,说明 `/api/search` rate-limit 不够,改 30→10/60s)
- [ ] DeepSeek 账单 < $1(ingest 已完成,不应再涨)
- [ ] Clerk Dashboard:登录流程无 error spike
- [ ] Google Search Console:提交 sitemap.xml(`https://kdsj.world/sitemap.xml`)
- [ ] Bing Webmaster Tools:同上

## T+7 天

- [ ] Lighthouse prod 真测(都用 Vercel 自带 Web Vitals):
  - Perf ≥ 80 · A11y ≥ 90 · Best Practices ≥ 90 · SEO ≥ 90
- [ ] Twitter @simprr 推文互动数据(点击 / 转发 / 留言)
- [ ] Vercel logs 错误率 < 1%
- [ ] 收藏功能(W5 stub auth)是否还在用 x-user-id header?如是,排期接 Clerk `auth()`
- [ ] LLM 准确率回测一次(case 量增 5 → 30,看是否随真实视频量降级)

## T+30 天 · 进 round-002 触发条件

任一满足则进 Phase D round-002:

- LLM 准确率 < 85% 且改 prompt 3 次未达标
- Vercel 月账单 > $20
- 实际访问 PV > 500/月 但收藏 = 0(产品-市场不 fit 信号)
- Alan 自用 4 周后仍想继续做 → 加新功能(进 SPEC vN+1,evolve build 模式)

---

*老吴 · 2026-05-25*

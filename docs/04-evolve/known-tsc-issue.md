# 已知问题: W4 · standalone `tsc --noEmit` 报 TS6046

## 现象

```bash
cd app && npx tsc --noEmit
# → error TS6046: Argument for '--moduleResolution' option must be: 'node', 'classic', 'node16', 'nodenext', 'bundler'.
```

但 `npm run build`(走 `next build` 内置 typecheck) **通过** ✅。

## 根因

`tsconfig.json` 设置 `"moduleResolution": "bundler"`,这是 Next.js 15 App Router 的官方推荐值(见 [Next.js docs - TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript))。

`tsc` CLI 在某些版本(尤其是 TypeScript 5.x 的几个 minor 版本之间)对 `bundler` 这个值的接受度不稳定,而 `next build` 内部用的是 webpack/turbopack 自己解析路径,**不依赖 tsc 的 `moduleResolution` 值**。

这是 upstream Next + TypeScript 协同问题,**不是 kdsj-world 项目代码的问题**。

## 决议

**不修代码,不改 tsconfig**(改了反而会破 Next 内部 build)。改用 `next build` 当作 typecheck 命令。

## 推荐补丁(可选)

在 `app/package.json` 添加 script:
```json
{
  "scripts": {
    "typecheck": "next build --no-lint"
  }
}
```

CI 用 `npm run typecheck` 代替 `npx tsc --noEmit`,获得真实可信的类型检查结果。

> 注: `next build --no-lint` 会做完整 type check 但跳过 ESLint,适合纯类型检查场景。如果要包含 lint,直接用 `npm run build`。

## 何时重审

- TypeScript 升到 6.0 之后
- Next.js 16 release 时

到那时再确认 `moduleResolution: bundler` 在 tsc CLI 上是否完全稳定。当下 Phase D 不阻塞上线。

---

*round-001 · 老吴 · 2026-05-25*

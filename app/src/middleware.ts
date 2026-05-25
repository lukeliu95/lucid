import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Clerk 提供 auth context;next-intl 负责双语路由。
// clerkMiddleware 默认所有路由公开,具体鉴权在各 API / 页面内做。
export default clerkMiddleware((_auth, req) => {
  // API 路由享有 Clerk auth context,但不经过 i18n 重写。
  if (req.nextUrl.pathname.startsWith("/api")) return;
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // 跳过 Next.js 内部资源与带后缀的静态文件,其余页面走 i18n。
    "/((?!_next|_vercel|.*\\..*).*)",
    // API 路由始终经过(注入 Clerk auth)。
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

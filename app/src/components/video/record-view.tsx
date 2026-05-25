"use client";
import * as React from "react";
import { useAuth } from "@clerk/nextjs";

/** 登录用户访问视频详情时,静默记录一次"查看"(用于"最近查看")。 */
export function RecordView({ slug }: { slug: string }) {
  const { isSignedIn } = useAuth();
  React.useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [isSignedIn, slug]);
  return null;
}

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "kdsj-world",
    phase: "B.1",
    ts: new Date().toISOString(),
  });
}

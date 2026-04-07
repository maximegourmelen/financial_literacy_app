import { NextResponse } from "next/server";

import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { getBusinessDate } from "@/lib/time";

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (expectedSecret && authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSavingsInterestUpToDate();

  return NextResponse.json({
    ok: true,
    processedThrough: getBusinessDate()
  });
}

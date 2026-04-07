import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";
import { appendMessage } from "@/lib/url";

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(
    new URL(appendMessage("/", "message", "You have been logged out."), request.url)
  );
}

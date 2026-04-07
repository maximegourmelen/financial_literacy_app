import { NextResponse } from "next/server";

import { signOutCurrentUser } from "@/lib/auth";
import { appendMessage } from "@/lib/url";

export async function POST(request: Request) {
  await signOutCurrentUser();
  return NextResponse.redirect(
    new URL(appendMessage("/", "message", "You have been logged out."), request.url)
  );
}

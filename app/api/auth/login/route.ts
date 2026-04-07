import { NextResponse } from "next/server";

import { authenticateUser } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { appendMessage } from "@/lib/url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expectedRole = formData.get("expectedRole") === "admin" ? "admin" : "child";

  const failurePath = expectedRole === "admin" ? "/admin/login" : "/login";

  if (!username || !password) {
    return NextResponse.redirect(
      new URL(appendMessage(failurePath, "error", "Enter both username and password."), request.url)
    );
  }

  const user = await authenticateUser({
    username,
    password,
    expectedRole
  });

  if (!user) {
    return NextResponse.redirect(
      new URL(
        appendMessage(failurePath, "error", "That login did not match the selected portal."),
        request.url
      )
    );
  }

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name
  });

  return NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/dashboard", request.url));
}

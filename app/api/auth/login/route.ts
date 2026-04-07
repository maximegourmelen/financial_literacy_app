import { NextResponse } from "next/server";

import { signInWithUsername } from "@/lib/auth";
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

  const user = await signInWithUsername({
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

  return NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/dashboard", request.url));
}

import { NextResponse } from "next/server";

import { countUsersByRole, createAuthBackedUser, signInWithUsername } from "@/lib/auth";
import { appendMessage } from "@/lib/url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const expectedRole = formData.get("expectedRole") === "admin" ? "admin" : "child";
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const setupCode = String(formData.get("setupCode") ?? "");

  const failurePath = expectedRole === "admin" ? "/admin/setup" : "/signup";

  if (!username || !password || !displayName) {
    return NextResponse.redirect(
      new URL(appendMessage(failurePath, "error", "Complete every required field."), request.url)
    );
  }

  if (expectedRole === "admin") {
    const configuredCode = process.env.ADMIN_SETUP_CODE;
    const adminCount = await countUsersByRole("admin");

    if (!configuredCode) {
      return NextResponse.redirect(
        new URL(
          appendMessage(
            failurePath,
            "error",
            "ADMIN_SETUP_CODE is missing from the environment."
          ),
          request.url
        )
      );
    }

    if (setupCode !== configuredCode) {
      return NextResponse.redirect(
        new URL(appendMessage(failurePath, "error", "The admin setup code is not correct."), request.url)
      );
    }

    if (adminCount >= 1) {
      return NextResponse.redirect(
        new URL(
          appendMessage(
            failurePath,
            "error",
            "An admin account already exists. Please use the admin login page."
          ),
          request.url
        )
      );
    }
  }

  try {
    await createAuthBackedUser({
      username,
      password,
      displayName,
      role: expectedRole
    });

    const user = await signInWithUsername({
      username,
      password,
      expectedRole
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(
          appendMessage(
            expectedRole === "admin" ? "/admin/login" : "/login",
            "message",
            "Account created. Please log in."
          ),
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL(user.role === "admin" ? "/admin" : "/dashboard", request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        appendMessage(
          failurePath,
          "error",
          error instanceof Error ? error.message : "Could not create that account."
        ),
        request.url
      )
    );
  }
}

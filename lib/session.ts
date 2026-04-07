import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/config";
import { createSignedSession, parseSignedSession } from "@/lib/security";
import { SessionPayload } from "@/lib/types";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return parseSignedSession(token);
}

export async function setSessionCookie(params: {
  userId: string;
  username: string;
  role: SessionPayload["role"];
  displayName: string;
}) {
  const cookieStore = await cookies();
  const token = createSignedSession(params);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

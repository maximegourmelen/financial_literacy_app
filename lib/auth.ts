import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { verifyPassword } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AppUser, SessionPayload, UserRole } from "@/lib/types";

export async function findUserByUsername(username: string): Promise<AppUser | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle<AppUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function authenticateUser(params: {
  username: string;
  password: string;
  expectedRole: UserRole;
}) {
  const user = await findUserByUsername(params.username);

  if (!user) {
    return null;
  }

  if (user.role !== params.expectedRole) {
    return null;
  }

  if (!verifyPassword(params.password, user.password_hash)) {
    return null;
  }

  return user;
}

export async function requireSession(role?: UserRole): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect(role === "admin" ? "/admin/login" : "/login");
  }

  if (role && session.role !== role) {
    redirect(session.role === "admin" ? "/admin" : "/dashboard");
  }

  return session;
}

export async function redirectIfLoggedIn(expectedRole: UserRole) {
  const session = await getSession();
  if (!session) {
    return;
  }

  if (session.role === expectedRole) {
    redirect(expectedRole === "admin" ? "/admin" : "/dashboard");
  }
}

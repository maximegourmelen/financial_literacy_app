import { redirect } from "next/navigation";

import { MAX_CHILD_ACCOUNTS } from "@/lib/config";
import { createSupabaseServerAuthClient } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AppUser, SessionPayload, UserRole } from "@/lib/types";
import {
  isStrongEnoughPassword,
  isValidUsername,
  normalizeUsername,
  usernameToEmail
} from "@/lib/usernames";

export async function findUserByUsername(username: string): Promise<AppUser | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("*")
    .eq("username", normalizeUsername(username))
    .maybeSingle<AppUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findUserByAuthUserId(authUserId: string): Promise<AppUser | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<AppUser>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function countUsersByRole(role: UserRole): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("*", { count: "exact", head: true })
    .eq("role", role);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function createAuthBackedUser(params: {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}) {
  const username = normalizeUsername(params.username);
  const displayName = params.displayName.trim();

  if (!isValidUsername(username)) {
    throw new Error("Usernames must be 3-32 characters using letters, numbers, dashes, or underscores.");
  }

  if (!isStrongEnoughPassword(params.password)) {
    throw new Error("Passwords must be at least 8 characters long.");
  }

  if (!displayName) {
    throw new Error("Please enter a display name.");
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    throw new Error("That username is already taken.");
  }

  if (params.role === "child") {
    const childCount = await countUsersByRole("child");
    if (childCount >= MAX_CHILD_ACCOUNTS) {
      throw new Error("This app is already using its two sibling accounts.");
    }
  }

  const email = usernameToEmail(username);
  const createdAuthUser = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      username,
      displayName,
      role: params.role
    }
  });

  if (createdAuthUser.error || !createdAuthUser.data.user) {
    throw new Error(createdAuthUser.error?.message || "Could not create the auth user.");
  }

  const authUserId = createdAuthUser.data.user.id;

  const { error: insertError } = await getSupabaseAdmin().from("app_users").insert({
    auth_user_id: authUserId,
    username,
    role: params.role,
    display_name: displayName
  });

  if (insertError) {
    await getSupabaseAdmin().auth.admin.deleteUser(authUserId);
    throw new Error(insertError.message);
  }

  return { authUserId, username, email };
}

export async function signInWithUsername(params: {
  username: string;
  password: string;
  expectedRole: UserRole;
}) {
  const user = await findUserByUsername(params.username);

  if (!user || user.role !== params.expectedRole) {
    return null;
  }

  const supabase = await createSupabaseServerAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(user.username),
    password: params.password
  });

  if (error || !data.user || data.user.id !== user.auth_user_id) {
    return null;
  }

  return user;
}

export async function signOutCurrentUser() {
  const supabase = await createSupabaseServerAuthClient();
  await supabase.auth.signOut();
}

export async function requireSession(role?: UserRole): Promise<SessionPayload> {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(role === "admin" ? "/admin/login" : "/login");
  }

  const appUser = await findUserByAuthUserId(user.id);
  if (!appUser) {
    await supabase.auth.signOut();
    redirect(role === "admin" ? "/admin/login" : "/login");
  }

  const session: SessionPayload = {
    userId: appUser.id,
    authUserId: appUser.auth_user_id,
    username: appUser.username,
    role: appUser.role,
    displayName: appUser.display_name
  };

  if (role && session.role !== role) {
    redirect(session.role === "admin" ? "/admin" : "/dashboard");
  }

  return session;
}

export async function redirectIfLoggedIn(expectedRole: UserRole) {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const appUser = await findUserByAuthUserId(user.id);
  if (!appUser) {
    return;
  }

  if (appUser.role === expectedRole) {
    redirect(expectedRole === "admin" ? "/admin" : "/dashboard");
  }
}

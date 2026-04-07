import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/config";

export async function createSupabaseServerAuthClient() {
  const cookieStore = await cookies();
  type SetCookieArgs = Parameters<typeof cookieStore.set>;
  type CookieToSet = {
    name: string;
    value: string;
    options?: SetCookieArgs[2];
  };

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always write cookies during render.
          // Middleware refresh keeps the auth cookies in sync for page requests.
        }
      }
    }
  });
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  type SetCookieArgs = Parameters<typeof response.cookies.set>;
  type CookieToSet = {
    name: string;
    value: string;
    options?: SetCookieArgs[2];
  };

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });
}

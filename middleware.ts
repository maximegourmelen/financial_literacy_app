import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase-auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const supabase = createSupabaseMiddlewareClient(request, response);
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

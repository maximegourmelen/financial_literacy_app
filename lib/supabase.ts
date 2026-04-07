import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv } from "@/lib/config";

let adminClient:
  | ReturnType<typeof createClient<any>>
  | null = null;

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<any>(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return adminClient;
}

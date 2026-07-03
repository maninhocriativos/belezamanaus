import type { Env } from "../env";

export function getSupabaseAdminHeaders(env: Env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json"
  };
}

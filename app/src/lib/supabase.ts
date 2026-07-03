import { createClient } from "@supabase/supabase-js";
import { appEnv } from "./env";

function getSupabaseConfigStatus() {
  if (!appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
    return "missing";
  }

  try {
    const url = new URL(appEnv.supabaseUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "invalid";
    }
  } catch {
    return "invalid";
  }

  return "ready";
}

export const supabaseConfigStatus = getSupabaseConfigStatus();
export const isSupabaseConfigured = supabaseConfigStatus === "ready";

function createSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    return createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch {
    return null;
  }
}

export const supabase = createSupabaseClient();

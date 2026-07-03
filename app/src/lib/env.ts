function getBrowserOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function getAppUrl() {
  const origin = getBrowserOrigin();
  const configured = import.meta.env.VITE_APP_URL ?? "";

  if (origin && !origin.includes("localhost")) {
    return origin;
  }

  return configured || origin || "http://localhost:5173";
}

export const appEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  appUrl: getAppUrl(),
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8787"
};

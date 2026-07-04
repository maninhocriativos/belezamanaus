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

function getApiUrl() {
  const origin = getBrowserOrigin();
  const configured = import.meta.env.VITE_API_URL ?? "";

  if (configured) return configured;

  if (origin && origin.includes("localhost")) {
    return "http://localhost:8787";
  }

  return "https://fisiolipo-crm-worker.maninhocriativos.workers.dev";
}

export const appEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  appUrl: getAppUrl(),
  apiUrl: getApiUrl()
};

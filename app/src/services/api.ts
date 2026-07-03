import { appEnv } from "../lib/env";
import { supabase } from "../lib/supabase";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const response = await fetch(`${appEnv.apiUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

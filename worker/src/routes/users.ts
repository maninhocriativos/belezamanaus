import type { Env } from "../env";
import { getSupabaseAdminHeaders } from "../services/supabase-admin";

type CreateUserPayload = {
  email?: string;
  fullName?: string;
  password?: string;
  role?: string;
};

function isValidServiceRole(env: Env) {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("eyJ"));
}

async function requireAuthenticatedUser(request: Request, env: Env) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization
    }
  });

  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; email?: string }>;
}

async function getPrimaryOrganizationId(env: Env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/organizations?select=id&name=eq.Beleza%20Manaus&limit=1`, {
    headers: getSupabaseAdminHeaders(env)
  });

  if (!response.ok) {
    throw new Error("Nao consegui localizar a organizacao Beleza Manaus.");
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id;
}

async function createAuthUser(env: Env, payload: Required<Pick<CreateUserPayload, "email" | "password">> & CreateUserPayload) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    body: JSON.stringify({
      email: payload.email,
      email_confirm: true,
      password: payload.password,
      user_metadata: {
        crm_profile_complete: true,
        full_name: payload.fullName ?? payload.email,
        organization_name: "Beleza Manaus"
      }
    }),
    headers: getSupabaseAdminHeaders(env),
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ id: string; email: string }>;
}

async function linkUserToOrganization(env: Env, user: { id: string; email: string }, organizationId: string, payload: CreateUserPayload) {
  const headers = {
    ...getSupabaseAdminHeaders(env),
    prefer: "resolution=merge-duplicates"
  };

  await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
    body: JSON.stringify({
      full_name: payload.fullName ?? user.email,
      id: user.id,
      organization_id: organizationId,
      role: payload.role ?? "agent"
    }),
    headers,
    method: "POST"
  });

  await fetch(`${env.SUPABASE_URL}/rest/v1/organization_members?on_conflict=organization_id,user_id`, {
    body: JSON.stringify({
      organization_id: organizationId,
      role: payload.role ?? "agent",
      user_id: user.id
    }),
    headers,
    method: "POST"
  });
}

export async function handleUsers(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!isValidServiceRole(env)) {
    return Response.json({ error: "Configure SUPABASE_SERVICE_ROLE_KEY real nos secrets do Worker para cadastrar usuarios." }, { status: 500 });
  }

  const currentUser = await requireAuthenticatedUser(request, env);
  if (!currentUser) {
    return Response.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const payload = (await request.json()) as CreateUserPayload;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";

  if (!email || !password) {
    return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return Response.json({ error: "A senha precisa ter 8+ caracteres, letra maiuscula, minuscula e numero." }, { status: 400 });
  }

  try {
    const organizationId = await getPrimaryOrganizationId(env);
    if (!organizationId) {
      return Response.json({ error: "Organizacao Beleza Manaus nao encontrada." }, { status: 404 });
    }

    const user = await createAuthUser(env, { ...payload, email, password });
    await linkUserToOrganization(env, user, organizationId, payload);

    return Response.json({ ok: true, user: { email: user.email, id: user.id, role: payload.role ?? "agent" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao cadastrar usuario." }, { status: 500 });
  }
}

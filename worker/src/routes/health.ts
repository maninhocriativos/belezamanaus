import type { Env } from "../env";

export async function handleHealth(_request: Request, env: Env): Promise<Response> {
  return Response.json({
    ok: true,
    service: "fisiolipo-crm-worker",
    environment: env.APP_ENV ?? "local"
  });
}

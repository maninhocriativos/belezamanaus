import type { Env } from "../env";

export async function handleMedia(_request: Request, _env: Env): Promise<Response> {
  return Response.json({ ok: true, upload: "placeholder" });
}

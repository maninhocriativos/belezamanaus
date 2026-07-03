import type { Env } from "../env";

export async function handleSales(_request: Request, _env: Env): Promise<Response> {
  return Response.json({ ok: true, sales: [] });
}

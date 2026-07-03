import type { Env } from "../env";
import { sendConversionEvent } from "../services/meta";

export async function handleMetaConversions(request: Request, env: Env): Promise<Response> {
  const payload = request.method === "POST" ? await request.json() : {};
  return Response.json(await sendConversionEvent(payload, env, { dryRun: env.APP_ENV !== "production" }));
}

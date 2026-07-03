import type { Env } from "../env";
import { getAdsInsights } from "../services/meta";

export async function handleMetaAdsInsights(_request: Request, env: Env): Promise<Response> {
  return Response.json(await getAdsInsights(env));
}

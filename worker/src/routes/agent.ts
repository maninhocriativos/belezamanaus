import type { Env } from "../env";
import { draftAgentReply } from "../services/agent-brain";

export async function handleAgent(request: Request, env: Env): Promise<Response> {
  const payload = request.method === "POST" ? await request.json() : {};
  return Response.json(await draftAgentReply({ ...(typeof payload === "object" && payload !== null ? payload : {}), offerValue: env.COMBO_FELICIDADE_VALUE }));
}

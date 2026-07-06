import type { Env } from "../env";
import { draftSmartAgentReply } from "../services/agent-intelligence";

export async function handleAgent(request: Request, env: Env): Promise<Response> {
  const payload = request.method === "POST" ? await request.json() : {};
  return Response.json(await draftSmartAgentReply({ ...(typeof payload === "object" && payload !== null ? payload : {}), offerValue: env.COMBO_FELICIDADE_VALUE }, env));
}

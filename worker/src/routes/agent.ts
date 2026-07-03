import type { Env } from "../env";
import { draftAgentReply } from "../services/agent-brain";

export async function handleAgent(request: Request, _env: Env): Promise<Response> {
  const payload = request.method === "POST" ? await request.json() : {};
  return Response.json(await draftAgentReply(payload));
}

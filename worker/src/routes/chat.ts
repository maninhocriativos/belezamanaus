import type { Env } from "../env";
import { listMessages, saveMessage } from "../services/d1";
import { normalizeMessage } from "../services/message-normalizer";

export async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    return Response.json(await listMessages(env.DB));
  }

  if (request.method === "POST") {
    const payload = normalizeMessage(await request.json());
    return Response.json(await saveMessage(env.DB, payload));
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

import type { Env } from "../env";
import { listConversations, listMessages, saveMessage } from "../services/d1";
import { normalizeMessage } from "../services/message-normalizer";

export async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/conversations")) {
      return Response.json(await listConversations(env.DB));
    }

    return Response.json(await listMessages(env.DB, url.searchParams.get("conversationId") ?? undefined));
  }

  if (request.method === "POST") {
    const payload = normalizeMessage(await request.json());
    return Response.json(await saveMessage(env.DB, payload));
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

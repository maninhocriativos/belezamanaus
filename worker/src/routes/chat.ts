import type { Env } from "../env";
import { listConversations, listMessages, saveMessage } from "../services/d1";
import { sendOutboundChannelMessage } from "../services/meta";
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
    let externalMessageId = payload.externalMessageId;
    let providerError = "";
    let status = payload.status ?? "sent";

    try {
      if (payload.direction === "outbound" && payload.messageType === "text" && payload.body) {
        const result = await sendOutboundChannelMessage(env, { conversationId: payload.conversationId, text: payload.body });
        externalMessageId = result.externalMessageId;
      }
    } catch (error) {
      status = "failed";
      providerError = error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem pelo canal.";
    }

    const saved = await saveMessage(env.DB, { ...payload, externalMessageId, status });
    return Response.json({ ...saved, providerError });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

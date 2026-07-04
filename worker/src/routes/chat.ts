import type { Env } from "../env";
import { listConversations, listMessages, saveMessage } from "../services/d1";
import { sendOutboundChannelMessage, syncInstagramInbox, syncMessengerInbox } from "../services/meta";
import { normalizeMessage } from "../services/message-normalizer";

export async function handleChat(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname.endsWith("/sync")) {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
      const channel = url.searchParams.get("channel") ?? "all";
      const facebook = channel === "all" || channel === "facebook"
        ? await syncMessengerInbox(env)
        : { conversations: 0, imported: 0, saved: 0, skipped: true };
      const instagram = channel === "all" || channel === "instagram"
        ? await syncInstagramInbox(env)
        : { conversations: 0, imported: 0, saved: 0, skipped: true };
      const whatsapp = channel === "all" || channel === "whatsapp"
        ? { conversations: 0, imported: 0, mode: "webhook_only", saved: 0 }
        : { conversations: 0, imported: 0, saved: 0, skipped: true };
      return Response.json({ facebook, instagram, whatsapp });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Nao foi possivel sincronizar o canal." },
        { status: 502 }
      );
    }
  }

  if (request.method === "GET") {
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

import type { Env } from "../env";
import { createLeadFromMetaEvent } from "../services/meta";
import { saveWebhookLog } from "../services/d1";

export async function handleMetaLeadsWebhook(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && token === env.META_VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }

    return Response.json({ error: "Invalid verification token" }, { status: 403 });
  }

  if (request.method === "POST") {
    try {
      const payload = await request.json();
      await saveWebhookLog(env.DB, { eventType: "meta_webhook_post", payload, provider: "meta", status: "received" });
      const result = await createLeadFromMetaEvent(payload, env);
      await saveWebhookLog(env.DB, { eventType: result.action, payload: { savedMessages: result.savedMessages.length }, provider: "meta", status: "processed" });
      return Response.json({ ok: true, result });
    } catch (error) {
      await saveWebhookLog(env.DB, {
        eventType: "meta_webhook_error",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
        provider: "meta",
        status: "error"
      });
      return Response.json({ error: "Webhook processing failed" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

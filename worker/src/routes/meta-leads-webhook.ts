import type { Env } from "../env";
import { createLeadFromMetaEvent } from "../services/meta";

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
    const payload = await request.json();
    const result = await createLeadFromMetaEvent(payload, env);
    return Response.json({ ok: true, result });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

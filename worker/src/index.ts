import type { Env } from "./env";
import { handleAgent } from "./routes/agent";
import { handleChat } from "./routes/chat";
import { handleHealth } from "./routes/health";
import { handleMedia } from "./routes/media";
import { handleMetaAdsInsights } from "./routes/meta-ads-insights";
import { handleMetaConversions } from "./routes/meta-conversions";
import { handleMetaLeadsWebhook } from "./routes/meta-leads-webhook";
import { handleSales } from "./routes/sales";

const routes = [
  ["/health", handleHealth],
  ["/webhooks/meta/leads", handleMetaLeadsWebhook],
  ["/meta/conversions", handleMetaConversions],
  ["/meta/ads-insights", handleMetaAdsInsights],
  ["/chat", handleChat],
  ["/media", handleMedia],
  ["/agent", handleAgent],
  ["/sales", handleSales]
] as const;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const match = routes.find(([path]) => url.pathname.startsWith(path));

    if (!match) {
      return Response.json({ error: "Not found" }, { headers: corsHeaders, status: 404 });
    }

    const response = await match[1](request, env);
    const nextHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      nextHeaders.set(key, value);
    }

    return new Response(response.body, {
      headers: nextHeaders,
      status: response.status,
      statusText: response.statusText
    });
  }
};

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = routes.find(([path]) => url.pathname.startsWith(path));

    if (!match) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return match[1](request, env);
  }
};

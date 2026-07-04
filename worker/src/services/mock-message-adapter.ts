import type { MessageAdapter } from "./message-adapter";

export const mockMessageAdapter: MessageAdapter = {
  channel: "crm",
  normalizeInbound() {
    return [];
  },
  async sendText() {
    return { ok: true, externalMessageId: crypto.randomUUID() };
  }
};

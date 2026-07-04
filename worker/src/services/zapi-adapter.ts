import type { MessageAdapter } from "./message-adapter";

export const zapiAdapter: MessageAdapter = {
  channel: "whatsapp",
  normalizeInbound() {
    return [];
  },
  async sendText() {
    throw new Error("Z-API nao esta configurado.");
  }
};

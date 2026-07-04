import type { MessageAdapter } from "./message-adapter";

export const fiqonAdapter: MessageAdapter = {
  channel: "whatsapp",
  normalizeInbound() {
    return [];
  },
  async sendText() {
    throw new Error("Fiqon nao esta configurado.");
  }
};

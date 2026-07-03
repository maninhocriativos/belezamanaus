export const mockMessageAdapter = {
  name: "mock",
  async sendText(body: string) {
    return { ok: true, externalMessageId: crypto.randomUUID(), body };
  }
};

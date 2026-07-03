export const zapiAdapter = {
  name: "zapi",
  async sendText() {
    return { ok: false, reason: "provider-not-configured" };
  }
};

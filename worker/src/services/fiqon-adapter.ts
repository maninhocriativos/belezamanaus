export const fiqonAdapter = {
  name: "fiqon",
  async sendText() {
    return { ok: false, reason: "provider-not-configured" };
  }
};

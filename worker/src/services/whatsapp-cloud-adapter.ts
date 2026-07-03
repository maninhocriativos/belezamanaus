export const whatsappCloudAdapter = {
  name: "whatsapp-cloud",
  async sendText() {
    return { ok: false, reason: "provider-not-configured" };
  }
};

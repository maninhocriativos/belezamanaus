import type { Env } from "../env";
import type { NormalizedMessage } from "../types/chat";

export type SendTextInput = {
  conversationId: string;
  recipientId: string;
  text: string;
};

export type SendTextResult = {
  externalMessageId?: string;
  ok: boolean;
};

export type MessageAdapter = {
  channel: NormalizedMessage["channel"];
  normalizeInbound(payload: unknown): NormalizedMessage[];
  sendText(env: Env, input: SendTextInput): Promise<SendTextResult>;
};

export function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function getText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeAttachmentType(type: string): NormalizedMessage["messageType"] {
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  if (type === "file" || type === "document") return "document";
  if (type === "image") return "image";
  return "text";
}

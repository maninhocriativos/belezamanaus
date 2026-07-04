import type { Env } from "../env";
import { saveMessage } from "./d1";
import { draftAgentReply } from "./agent-brain";

type InboundMetaMessage = {
  body: string;
  contactName?: string;
  contactAvatarUrl?: string;
  contactPhone?: string;
  conversationId: string;
  externalId?: string;
  leadId: string;
  mediaMimeType?: string;
  mediaUrl?: string;
  messageType: "audio" | "document" | "image" | "text" | "video";
  provider: "facebook" | "instagram" | "whatsapp";
};

type GraphConversation = {
  id?: string;
  messages?: { data?: GraphMessage[] };
  participants?: { data?: Array<{ id?: string; name?: string }> };
};

type GraphMessage = {
  attachments?: { data?: Array<{ image_data?: { url?: string }; mime_type?: string; name?: string; type?: string }> };
  created_time?: string;
  from?: { id?: string; name?: string };
  id?: string;
  message?: string;
  to?: { data?: Array<{ id?: string; name?: string }> };
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeAttachmentType(type: string): InboundMetaMessage["messageType"] {
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  if (type === "file" || type === "document") return "document";
  if (type === "image") return "image";
  return "text";
}

function getMessengerPageId(env: Env) {
  return env.META_PAGE_ID || "1256240180895678";
}

function getInstagramAccountId(env: Env) {
  return env.META_INSTAGRAM_ACCOUNT_ID || "17841414340853884";
}

function titleCaseChannel(provider: InboundMetaMessage["provider"]) {
  if (provider === "facebook") return "Facebook";
  if (provider === "instagram") return "Instagram";
  return "WhatsApp";
}

function extractMessagingMessages(payload: unknown): InboundMetaMessage[] {
  const root = asObject(payload);
  const provider = root.object === "instagram" ? "instagram" : "facebook";
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: InboundMetaMessage[] = [];

  for (const entry of entries) {
    const messaging = Array.isArray(asObject(entry).messaging) ? asObject(entry).messaging as unknown[] : [];
    for (const event of messaging) {
      const item = asObject(event);
      const sender = asObject(item.sender);
      const message = asObject(item.message);
      const senderId = getText(sender.id);
      const text = getText(message.text);
      const attachments = Array.isArray(message.attachments) ? message.attachments as unknown[] : [];

      if (senderId && text) {
        messages.push({
          body: text,
          conversationId: `${provider}:${senderId}`,
          externalId: getText(message.mid),
          leadId: senderId,
          messageType: "text",
          provider
        });
      }

      for (const rawAttachment of attachments) {
        const attachment = asObject(rawAttachment);
        const type = normalizeAttachmentType(getText(attachment.type));
        const payload = asObject(attachment.payload);
        const url = getText(payload.url);

        if (senderId && type !== "text") {
          messages.push({
            body: `[${type} recebido via ${provider === "instagram" ? "Instagram" : "Facebook"}]`,
            conversationId: `${provider}:${senderId}`,
            externalId: getText(message.mid),
            leadId: senderId,
            mediaUrl: url,
            messageType: type,
            provider
          });
        }
      }
    }
  }

  return messages;
}

function extractWhatsappMessages(payload: unknown): InboundMetaMessage[] {
  const root = asObject(payload);
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const messages: InboundMetaMessage[] = [];

  for (const entry of entries) {
    const changes = Array.isArray(asObject(entry).changes) ? asObject(entry).changes as unknown[] : [];
    for (const change of changes) {
      const value = asObject(asObject(change).value);
      const whatsappMessages = Array.isArray(value.messages) ? value.messages as unknown[] : [];

      for (const rawMessage of whatsappMessages) {
        const message = asObject(rawMessage);
        const from = getText(message.from);
        const type = getText(message.type);
        const textBody = getText(asObject(message.text).body);
        const media = asObject(message[type]);
        const mediaId = getText(media.id);
        const caption = getText(media.caption);
        const mimeType = getText(media.mime_type);
        const messageType = normalizeAttachmentType(type);
        const body = textBody || caption || `[${messageType || "mensagem"} recebida via WhatsApp]`;

        if (from && body) {
          messages.push({
            body,
            conversationId: `whatsapp:${from}`,
            externalId: getText(message.id),
            leadId: from,
            mediaMimeType: mimeType,
            mediaUrl: mediaId ? `meta-media:${mediaId}` : undefined,
            messageType,
            provider: "whatsapp"
          });
        }
      }
    }
  }

  return messages;
}

async function persistInboundMessages(messages: InboundMetaMessage[], env: Env) {
  const saved = [];

  for (const message of messages) {
    const profile = message.contactName || message.contactAvatarUrl ? {} : await fetchChannelProfile(env, message.provider, message.leadId);
    const savedMessage = await saveMessage(env.DB, {
      body: message.body,
      conversationId: message.conversationId,
      conversationMeta: {
        avatarUrl: message.contactAvatarUrl ?? profile.avatarUrl,
        channel: message.provider,
        contactName: message.contactName ?? profile.name ?? `${titleCaseChannel(message.provider)} ${message.leadId}`,
        contactPhone: message.contactPhone,
        isTyping: false,
        presenceStatus: "online"
      },
      direction: "inbound",
      externalMessageId: message.externalId,
      leadId: message.leadId,
      mediaMimeType: message.mediaMimeType,
      mediaUrl: message.mediaUrl,
      messageType: message.messageType,
      organizationId: "beleza-manaus",
      senderType: message.provider
    });
    saved.push(savedMessage);
    await maybeAutoReplyToLead(env, message, savedMessage);
  }

  return saved;
}

export async function createLeadFromMetaEvent(payload: unknown, env: Env) {
  const messages = [...extractMessagingMessages(payload), ...extractWhatsappMessages(payload)];
  const savedMessages = await persistInboundMessages(messages, env);

  return {
    action: savedMessages.length > 0 ? "messages_received" : "lead_received",
    mode: savedMessages.length > 0 ? "d1_messages" : "lead_placeholder",
    payload,
    savedMessages
  };
}

function getChannelRecipient(conversationId: string) {
  const separatorIndex = conversationId.indexOf(":");
  if (separatorIndex < 0) return { channel: "crm", recipientId: conversationId };

  return {
    channel: conversationId.slice(0, separatorIndex),
    recipientId: conversationId.slice(separatorIndex + 1)
  };
}

async function sendFacebookOrInstagramMessage(env: Env, recipientId: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`, {
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      message: { text },
      recipient: { id: recipientId }
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data as { message_id?: string; recipient_id?: string };
}

async function fetchChannelProfile(env: Env, provider: InboundMetaMessage["provider"], id: string) {
  if (provider === "whatsapp") return {};

  const fields = provider === "instagram" ? "name,username,profile_pic" : "first_name,last_name,profile_pic,name";
  const response = await fetch(`https://graph.facebook.com/v20.0/${id}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || typeof data !== "object" || data === null) {
    return {};
  }

  const profile = data as { first_name?: string; last_name?: string; name?: string; profile_pic?: string; username?: string };
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

  return {
    avatarUrl: profile.profile_pic,
    name: fullName || profile.name || profile.username
  };
}

async function sendWhatsappMessage(env: Env, recipientId: string, text: string) {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || env.META_PAGE_ACCESS_TOKEN;

  if (!env.META_PHONE_NUMBER_ID || !accessToken) {
    throw new Error("WhatsApp ainda nao esta configurado. Informe META_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN depois de conectar o numero.");
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${env.META_PHONE_NUMBER_ID}/messages`, {
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: text, preview_url: false }
    }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const messages = Array.isArray((data as { messages?: unknown[] }).messages) ? (data as { messages?: Array<{ id?: string }> }).messages : [];
  return { message_id: messages?.[0]?.id };
}

export async function sendOutboundChannelMessage(env: Env, input: { conversationId: string; text: string }) {
  const { channel, recipientId } = getChannelRecipient(input.conversationId);

  if (channel === "facebook" || channel === "instagram") {
    const data = await sendFacebookOrInstagramMessage(env, recipientId, input.text);
    return { channel, externalMessageId: data.message_id, ok: true };
  }

  if (channel === "whatsapp") {
    const data = await sendWhatsappMessage(env, recipientId, input.text);
    return { channel, externalMessageId: data.message_id, ok: true };
  }

  return { channel, externalMessageId: undefined, ok: true };
}

async function maybeAutoReplyToLead(env: Env, message: InboundMetaMessage, savedMessage: Record<string, unknown>) {
  if (savedMessage.deduped || message.messageType !== "text" || !message.body.trim()) return;

  const draft = await draftAgentReply({ leadId: message.leadId, message: message.body, organizationId: "beleza-manaus" });
  if (!draft.reply) return;

  try {
    const sent = await sendOutboundChannelMessage(env, { conversationId: message.conversationId, text: draft.reply });
    await saveMessage(env.DB, {
      body: draft.reply,
      conversationId: message.conversationId,
      conversationMeta: {
        avatarUrl: message.contactAvatarUrl,
        channel: message.provider,
        contactName: message.contactName ?? `${titleCaseChannel(message.provider)} ${message.leadId}`,
        contactPhone: message.contactPhone,
        isTyping: false,
        presenceStatus: "online"
      },
      direction: "outbound",
      externalMessageId: sent.externalMessageId,
      leadId: message.leadId,
      messageType: "text",
      organizationId: "beleza-manaus",
      senderType: "agent",
      status: "sent"
    });
  } catch (error) {
    await saveMessage(env.DB, {
      body: draft.reply,
      conversationId: message.conversationId,
      conversationMeta: {
        avatarUrl: message.contactAvatarUrl,
        channel: message.provider,
        contactName: message.contactName ?? `${titleCaseChannel(message.provider)} ${message.leadId}`,
        contactPhone: message.contactPhone,
        isTyping: false,
        presenceStatus: "online"
      },
      direction: "outbound",
      leadId: message.leadId,
      messageType: "text",
      organizationId: "beleza-manaus",
      senderType: "agent",
      status: "failed"
    });
  }
}

function getOtherParticipantId(conversation: GraphConversation, pageId: string) {
  const participants = conversation.participants?.data ?? [];
  const otherParticipant = participants.find((participant) => participant.id && participant.id !== pageId);
  return otherParticipant?.id ?? "";
}

function getOtherParticipant(conversation: GraphConversation, pageId: string) {
  const participants = conversation.participants?.data ?? [];
  return participants.find((participant) => participant.id && participant.id !== pageId);
}

function getGraphMessageType(message: GraphMessage): InboundMetaMessage["messageType"] {
  const attachment = message.attachments?.data?.[0];
  return normalizeAttachmentType(getText(attachment?.type));
}

function getGraphMessageBody(message: GraphMessage, messageType: InboundMetaMessage["messageType"]) {
  if (message.message) return message.message;
  if (messageType === "image") return "[imagem recebida via Facebook]";
  if (messageType === "video") return "[video recebido via Facebook]";
  if (messageType === "audio") return "[audio recebido via Facebook]";
  if (messageType === "document") return "[documento recebido via Facebook]";
  return "";
}

export async function syncMessengerInbox(env: Env) {
  const pageId = getMessengerPageId(env);
  const fields = "id,updated_time,participants.limit(10){id,name},messages.limit(20){id,message,from,to,created_time,attachments{mime_type,name,type,image_data}}";
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/conversations?fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const conversations = Array.isArray((data as { data?: unknown[] }).data) ? ((data as { data?: GraphConversation[] }).data ?? []) : [];
  const saved = [];

  for (const conversation of conversations) {
    const otherParticipant = getOtherParticipant(conversation, pageId);
    const otherParticipantId = otherParticipant?.id ?? getOtherParticipantId(conversation, pageId);
    const profile = otherParticipantId ? await fetchChannelProfile(env, "facebook", otherParticipantId) : {};
    const messages = conversation.messages?.data ?? [];

    for (const graphMessage of messages.reverse()) {
      const fromId = graphMessage.from?.id ?? "";
      const recipientId = graphMessage.to?.data?.find((recipient) => recipient.id !== fromId)?.id ?? "";
      const leadId = fromId === pageId ? otherParticipantId || recipientId : fromId || otherParticipantId;

      if (!leadId || !graphMessage.id) continue;

      const messageType = getGraphMessageType(graphMessage);
      const attachment = graphMessage.attachments?.data?.[0];
      const body = getGraphMessageBody(graphMessage, messageType);
      if (!body) continue;

      saved.push(
        await saveMessage(env.DB, {
          body,
          conversationId: `facebook:${leadId}`,
          conversationMeta: {
            avatarUrl: profile.avatarUrl,
            channel: "facebook",
            contactName: profile.name ?? otherParticipant?.name ?? `Facebook ${leadId}`,
            isTyping: false,
            presenceStatus: "online"
          },
          direction: fromId === pageId ? "outbound" : "inbound",
          externalMessageId: graphMessage.id,
          leadId,
          mediaMimeType: attachment?.mime_type,
          mediaUrl: attachment?.image_data?.url,
          messageType,
          organizationId: "beleza-manaus",
          senderType: "facebook",
          status: "sent"
        })
      );

      const savedMessage = saved[saved.length - 1];
      if (fromId !== pageId) {
        await maybeAutoReplyToLead(env, {
          body,
          contactAvatarUrl: profile.avatarUrl,
          contactName: profile.name ?? otherParticipant?.name,
          conversationId: `facebook:${leadId}`,
          externalId: graphMessage.id,
          leadId,
          messageType,
          provider: "facebook"
        }, savedMessage);
      }
    }
  }

  return {
    conversations: conversations.length,
    imported: saved.filter((message) => !("deduped" in message)).length,
    pageId,
    saved: saved.length
  };
}

export async function syncInstagramInbox(env: Env) {
  const accountId = getInstagramAccountId(env);
  const fields = "id,updated_time,participants.limit(10){id,name,username},messages.limit(20){id,message,from,to,created_time,attachments{mime_type,name,type,image_data}}";
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${accountId}/conversations?platform=instagram&fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(env.META_PAGE_ACCESS_TOKEN)}`
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      accountId,
      conversations: 0,
      error: data,
      imported: 0,
      saved: 0
    };
  }

  const conversations = Array.isArray((data as { data?: unknown[] }).data) ? ((data as { data?: GraphConversation[] }).data ?? []) : [];
  const saved = [];

  for (const conversation of conversations) {
    const otherParticipant = getOtherParticipant(conversation, accountId);
    const otherParticipantId = otherParticipant?.id ?? getOtherParticipantId(conversation, accountId);
    const messages = conversation.messages?.data ?? [];

    for (const graphMessage of messages.reverse()) {
      const fromId = graphMessage.from?.id ?? "";
      const recipientId = graphMessage.to?.data?.find((recipient) => recipient.id !== fromId)?.id ?? "";
      const leadId = fromId === accountId ? otherParticipantId || recipientId : fromId || otherParticipantId;
      if (!leadId || !graphMessage.id) continue;

      const messageType = getGraphMessageType(graphMessage);
      const attachment = graphMessage.attachments?.data?.[0];
      const body = getGraphMessageBody(graphMessage, messageType).replace("Facebook", "Instagram");
      if (!body) continue;

      saved.push(
        await saveMessage(env.DB, {
          body,
          conversationId: `instagram:${leadId}`,
          conversationMeta: {
            channel: "instagram",
            contactName: otherParticipant?.name ?? `Instagram ${leadId}`,
            isTyping: false,
            presenceStatus: "online"
          },
          direction: fromId === accountId ? "outbound" : "inbound",
          externalMessageId: graphMessage.id,
          leadId,
          mediaMimeType: attachment?.mime_type,
          mediaUrl: attachment?.image_data?.url,
          messageType,
          organizationId: "beleza-manaus",
          senderType: "instagram",
          status: "sent"
        })
      );

      const savedMessage = saved[saved.length - 1];
      if (fromId !== accountId) {
        await maybeAutoReplyToLead(env, {
          body,
          contactName: otherParticipant?.name,
          conversationId: `instagram:${leadId}`,
          externalId: graphMessage.id,
          leadId,
          messageType,
          provider: "instagram"
        }, savedMessage);
      }
    }
  }

  return {
    accountId,
    conversations: conversations.length,
    imported: saved.filter((message) => !("deduped" in message)).length,
    saved: saved.length
  };
}

export async function getAdsInsights(_env: Env) {
  return {
    mode: "placeholder",
    campaigns: []
  };
}

export async function sendConversionEvent(payload: unknown, _env: Env, options: { dryRun: boolean }) {
  return {
    dryRun: options.dryRun,
    event: payload,
    sent: !options.dryRun
  };
}

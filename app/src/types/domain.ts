export type LeadTemperature = "cold" | "warm" | "hot";

export type LeadStatus =
  | "new"
  | "in_service"
  | "qualified"
  | "scheduled"
  | "sold"
  | "lost";

export type MessageDirection = "inbound" | "outbound";

export type MessageType = "text" | "audio" | "image" | "document" | "internal_note";

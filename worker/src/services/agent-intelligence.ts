import type { Env } from "../env";
import { draftAgentReply as draftRuleBasedReply } from "./agent-brain";

type AgentPayload = {
  channel?: string;
  history?: Array<{ direction?: string; text?: string; type?: string }>;
  leadId?: string;
  mediaContext?: string;
  message?: string;
  offerValue?: string;
  organizationId?: string;
};

type AgentDraft = {
  ad: {
    oferta: string;
    origem_anuncio: string;
    procedimento: string;
  } | null;
  handoff: {
    motivo: string;
    oferta: string;
    origem_anuncio: string;
    procedimento: string;
    status: string;
  } | null;
  mode: string;
  payload: unknown;
  reply: string;
};

const unsafeTerms = [
  "acaba com cansaco",
  "cura",
  "deficiencia",
  "resultado imediato",
  "tratamento garantido"
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildAgentPrompt() {
  return [
    "Voce e o atendente virtual da Beleza Manaus.",
    "Atenda leads do Facebook, Instagram e WhatsApp com respostas curtas, claras, simpaticas e profissionais.",
    "Nunca presuma que o cliente veio de anuncio. Identifique codigo, oferta, procedimento ou intencao na mensagem e no historico.",
    "Codigo conhecido: VIT_D_B12_COMBO_01 = Combo da Felicidade, Reposicao de Vitaminas D + B12.",
    "Nao prometa resultado e nao use: cura, acaba com cansaco, resolve falta de energia, resultado imediato, tratamento garantido, indicado para deficiencia.",
    "Use termos seguros: autocuidado, bem-estar, reposicao de vitaminas, atendimento profissional, orientacao da equipe, horario agendado.",
    "Quando o cliente demonstrar intencao de reservar, agendar ou pagar, responda sobre 50% de reserva e marque handoff.status como ATENDIMENTO_HUMANO.",
    "Quando nao houver origem clara, pergunte de qual anuncio/oferta veio ou como pode ajudar, sem vender Combo da Felicidade.",
    "Se receber midia, considere mediaContext para entender audio/imagem/documento.",
    "Responda somente JSON valido com: reply:string, ad:null|{origem_anuncio,oferta,procedimento}, handoff:null|{status,motivo,origem_anuncio,oferta,procedimento}."
  ].join("\n");
}

function safeJsonParse(value: string) {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("AI returned non-json response.");
  }
}

function normalizeAiReply(value: unknown, fallback: AgentDraft): AgentDraft {
  const data = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const reply = String(data.reply ?? "").trim();
  const normalizedReply = normalizeText(reply);
  const hasUnsafeTerm = unsafeTerms.some((term) => normalizedReply.includes(term));
  if (!reply || reply.length > 900 || hasUnsafeTerm) return fallback;

  const adData = typeof data.ad === "object" && data.ad !== null ? data.ad as Record<string, unknown> : null;
  const adCode = String(adData?.origem_anuncio ?? fallback.ad?.origem_anuncio ?? "").trim();
  const ad = adCode === "VIT_D_B12_COMBO_01"
    ? {
        oferta: "Combo da Felicidade",
        origem_anuncio: "VIT_D_B12_COMBO_01",
        procedimento: "Reposicao de Vitaminas D + B12"
      }
    : null;
  const handoffData = typeof data.handoff === "object" && data.handoff !== null ? data.handoff as Record<string, unknown> : null;
  const wantsHandoff = handoffData?.status === "ATENDIMENTO_HUMANO" || Boolean(data.transferToHuman);

  return {
    ...fallback,
    ad,
    handoff: wantsHandoff && ad
      ? {
          motivo: "RESERVA_COM_PAGAMENTO_50",
          oferta: ad.oferta,
          origem_anuncio: ad.origem_anuncio,
          procedimento: ad.procedimento,
          status: "ATENDIMENTO_HUMANO"
        }
      : null,
    mode: "ai-assisted",
    reply
  };
}

async function draftOpenAiReply(payload: AgentPayload, env: Env, fallback: AgentDraft) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        { role: "system", content: buildAgentPrompt() },
        { role: "user", content: JSON.stringify(payload).slice(0, 12000) }
      ],
      max_output_tokens: 450,
      model: env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0.2
    }),
    headers: {
      authorization: `Bearer ${env.AI_API_KEY}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(JSON.stringify(data));
  const outputText = typeof (data as { output_text?: unknown }).output_text === "string"
    ? (data as { output_text: string }).output_text
    : JSON.stringify(data);

  return normalizeAiReply(safeJsonParse(outputText), fallback);
}

export async function draftSmartAgentReply(payload: unknown, env: Env) {
  const input = typeof payload === "object" && payload !== null ? payload as AgentPayload : {};
  const fallback = await draftRuleBasedReply(input) as AgentDraft;
  const provider = (env.AI_PROVIDER ?? "").toLowerCase();

  if (provider !== "openai" || !env.AI_API_KEY) return fallback;

  try {
    return await draftOpenAiReply(input, env, fallback);
  } catch {
    return fallback;
  }
}

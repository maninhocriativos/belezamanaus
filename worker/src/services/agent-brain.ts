type AgentPayload = {
  leadId?: string;
  message?: string;
  offerValue?: string;
  organizationId?: string;
};

const ADS = {
  VIT_D_B12_COMBO_01: {
    code: "VIT_D_B12_COMBO_01",
    offer: "Combo da Felicidade",
    procedure: "Reposicao de Vitaminas D + B12"
  }
} as const;

type KnownAdCode = keyof typeof ADS;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function identifyAdCode(originalMessage: string, message: string): KnownAdCode | null {
  if (originalMessage.includes("VIT_D_B12_COMBO_01")) return "VIT_D_B12_COMBO_01";
  if ((message.includes("combo") && message.includes("felicidade")) || (message.includes("vitamina") && message.includes("b12"))) return "VIT_D_B12_COMBO_01";
  return null;
}

function hasAny(message: string, terms: string[]) {
  return terms.some((term) => message.includes(term));
}

function shouldHandoff(message: string) {
  return hasAny(message, [
    "agendar",
    "agenda",
    "agendamento",
    "horario",
    "hoje",
    "amanha",
    "outro dia",
    "manha",
    "tarde",
    "noite",
    "reservar",
    "reserva",
    "pagar",
    "pagamento",
    "pix",
    "cartao",
    "quero fazer",
    "quero marcar",
    "pode marcar",
    "vou querer",
    "fechar"
  ]);
}

function buildHandoff(adCode: KnownAdCode) {
  const ad = ADS[adCode];
  return {
    status: "ATENDIMENTO_HUMANO",
    motivo: "RESERVA_COM_PAGAMENTO_50",
    origem_anuncio: ad.code,
    oferta: ad.offer,
    procedimento: ad.procedure
  };
}

export async function draftAgentReply(payload: unknown) {
  const input = typeof payload === "object" && payload !== null ? (payload as AgentPayload) : {};
  const originalMessage = String(input.message ?? "").trim();
  const message = normalizeText(originalMessage);
  const adCode = identifyAdCode(originalMessage, message);
  const ad = adCode ? ADS[adCode] : null;
  const offerValue = String(input.offerValue ?? "[VALOR]").trim() || "[VALOR]";
  let handoff = null;
  let reply = "Ola! Recebi sua mensagem.\n\nPara te ajudar melhor, voce veio de qual anuncio ou oferta?";

  if (!message) {
    reply = "Ola! Recebi sua mensagem.\n\nPara te ajudar melhor, voce veio de qual anuncio ou oferta?";
  } else if (hasAny(message, ["teste", "testando"])) {
    reply = "Recebi seu teste por aqui.\n\nQuando quiser, me envie o codigo do anuncio ou o nome da oferta para eu continuar o atendimento certinho.";
  } else if (!ad) {
    reply = "Ola! Recebi sua mensagem.\n\nPara te ajudar melhor, me envie o codigo do anuncio ou o nome da oferta que voce viu.";
  } else if (hasAny(message, ["preco", "valor", "quanto", "custa"])) {
    reply = `A oferta especial do ${ad.offer} esta saindo por R$ ${offerValue}.\n\nPara reservar a data e o horario, e necessario o pagamento de 50% do valor.\n\nO restante pode ser acertado no dia do atendimento.\n\nVoce gostaria que eu verificasse um horario disponivel para voce?`;
  } else if (hasAny(message, ["como funciona", "funciona", "atendimento"])) {
    reply = "O atendimento e feito com horario agendado. Primeiro verificamos o melhor dia e periodo para voce. Para reservar a data, e necessario o pagamento de 50% do valor, e o restante pode ser acertado no dia do atendimento.\n\nVoce prefere atendimento hoje ou outro dia?";
  } else if (hasAny(message, ["para que serve", "pra que serve", "serve para", "beneficio", "beneficios"])) {
    reply = "A reposicao de Vitaminas D + B12 faz parte de uma rotina de autocuidado e bem-estar. A equipe orienta cada caso antes do atendimento, de forma profissional e segura.\n\nQuer que eu veja horarios disponiveis para voce?";
  } else if (shouldHandoff(message)) {
    const chosePeriod = hasAny(message, ["manha", "tarde", "noite"]);
    handoff = buildHandoff(ad.code);
    reply = chosePeriod
      ? "Certo. Para reservar sua data e horario, e necessario o pagamento de 50% do valor da oferta.\n\nVou te transferir agora para uma atendente finalizar sua reserva, confirmar a disponibilidade certinha e enviar as informacoes de pagamento."
      : "Perfeito \uD83D\uDE0A\n\nQual melhor periodo para voce?\n\n1\uFE0F\u20E3 Manha\n2\uFE0F\u20E3 Tarde\n3\uFE0F\u20E3 Noite";
  }

  return {
    mode: "assisted",
    reply,
    handoff,
    ad: ad ? {
      origem_anuncio: ad.code,
      oferta: ad.offer,
      procedimento: ad.procedure
    } : null,
    payload
  };

}

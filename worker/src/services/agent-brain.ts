export async function draftAgentReply(payload: unknown) {
  const input = typeof payload === "object" && payload !== null ? (payload as { message?: string }) : {};
  const message = String(input.message ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  let reply = "Me conta qual area voce quer tratar e se seu objetivo e reduzir medidas, melhorar contorno ou aliviar algum incomodo. Com isso eu direciono melhor a avaliacao.";

  if (/^(oi|ola|bom dia|boa tarde|boa noite|teste|test)$/i.test(message)) {
    reply = "Oi! Para eu te ajudar melhor, qual procedimento ou regiao voce tem interesse em avaliar?";
  } else if (message.includes("preco") || message.includes("valor") || message.includes("quanto")) {
    reply = "Os valores dependem da avaliacao e da regiao tratada. Posso te passar os horarios para uma avaliacao gratuita hoje?";
  } else if (message.includes("agenda") || message.includes("horario") || message.includes("avaliacao")) {
    reply = "Temos disponibilidade para avaliacao hoje no fim da tarde e amanha pela manha. Qual horario fica melhor para voce?";
  } else if (message.includes("barriga") || message.includes("medida") || message.includes("gordura")) {
    reply = "Entendi. Para reducao de medidas, a especialista avalia a regiao e indica o protocolo ideal. Voce ja fez algum procedimento antes?";
  } else if (message.includes("celulite") || message.includes("flacidez")) {
    reply = "Da para avaliar isso com calma na consulta gratuita. A especialista ve a regiao, entende seu objetivo e indica o protocolo mais adequado.";
  } else if (message.includes("local") || message.includes("endereco") || message.includes("onde")) {
    reply = "Atendemos em Manaus. Posso te encaminhar para a especialista confirmar endereco, horarios disponiveis e melhor encaixe para avaliacao.";
  }

  return {
    mode: "assisted",
    reply,
    payload
  };
}

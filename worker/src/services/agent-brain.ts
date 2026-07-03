export async function draftAgentReply(payload: unknown) {
  const input = typeof payload === "object" && payload !== null ? (payload as { message?: string }) : {};
  const message = String(input.message ?? "").toLowerCase();
  let reply = "Posso te ajudar com algumas perguntas rapidas para entender seu objetivo e chamar uma especialista se fizer sentido.";

  if (message.includes("preco") || message.includes("valor") || message.includes("quanto")) {
    reply = "Os valores dependem da avaliacao e da regiao tratada. Posso te passar os horarios para uma avaliacao gratuita hoje?";
  } else if (message.includes("agenda") || message.includes("horario") || message.includes("avaliacao")) {
    reply = "Temos disponibilidade para avaliacao hoje no fim da tarde e amanha pela manha. Qual horario fica melhor para voce?";
  } else if (message.includes("barriga") || message.includes("medida") || message.includes("gordura")) {
    reply = "Entendi. Para reducao de medidas, a especialista avalia a regiao e indica o protocolo ideal. Voce ja fez algum procedimento antes?";
  }

  return {
    mode: "assisted",
    reply,
    payload
  };
}

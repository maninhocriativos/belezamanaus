export async function draftAgentReply(payload: unknown) {
  return {
    mode: "mock",
    reply: "Posso te ajudar com algumas perguntas rapidas para entender seu objetivo e chamar uma especialista se fizer sentido.",
    payload
  };
}

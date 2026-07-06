export async function draftAgentReply(payload: unknown) {
  const input = typeof payload === "object" && payload !== null ? (payload as { message?: string }) : {};
  const originalMessage = String(input.message ?? "").trim();
  const message = originalMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const intro = "Oi, sou a Aline da Fisiolipo.";
  let reply = `${intro} Me conta qual area voce quer tratar e se seu objetivo e reduzir medidas, melhorar contorno ou aliviar algum incomodo. Assim eu direciono melhor sua avaliacao.`;

  if (!message) {
    reply = `${intro} Recebi sua mensagem. Para te ajudar melhor, voce busca avaliacao corporal, facial, dor/incomodo ou acompanhamento estetico?`;
  } else if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|hey|hello)$/i.test(originalMessage)) {
    reply = `${intro} Seja bem-vinda(o). Voce procura ajuda com reducao de medidas, gordura localizada, celulite, flacidez, facial ou outro objetivo?`;
  } else if (/^(teste|test|testando)$/i.test(message)) {
    reply = `${intro} Recebi seu teste por aqui. Quando quiser, me diga o procedimento ou objetivo do lead que eu continuo o atendimento.`;
  } else if (message.includes("vitamina") || message.includes("vitaminas") || message.includes("soro") || message.includes("soroterapia")) {
    reply = `${intro} Entendi seu interesse em vitaminas/soroterapia. Voce busca mais energia, imunidade, recuperacao, estetica ou indicacao medica? Posso encaminhar para avaliacao com a equipe.`;
  } else if (message.includes("preco") || message.includes("valor") || message.includes("quanto") || message.includes("custa")) {
    reply = `${intro} Os valores dependem do objetivo, regiao tratada e protocolo indicado. Posso te colocar em uma avaliacao para a especialista orientar com seguranca?`;
  } else if (message.includes("agenda") || message.includes("horario") || message.includes("avaliacao")) {
    reply = `${intro} Posso te ajudar com a avaliacao. Voce prefere hoje, amanha ou outro dia? Se puder, me diga tambem o melhor turno.`;
  } else if (message.includes("barriga") || message.includes("medida") || message.includes("gordura") || message.includes("emagrecer") || message.includes("culote") || message.includes("flanco")) {
    reply = `${intro} Entendi. Para reducao de medidas/gordura localizada, a especialista avalia a regiao e monta o protocolo ideal. Qual area mais te incomoda hoje?`;
  } else if (message.includes("celulite") || message.includes("flacidez") || message.includes("estria")) {
    reply = `${intro} Da para avaliar isso com calma. A especialista precisa ver a regiao e entender ha quanto tempo voce percebeu essa queixa. Qual area voce quer tratar?`;
  } else if (message.includes("rosto") || message.includes("facial") || message.includes("pele") || message.includes("limpeza") || message.includes("melasma")) {
    reply = `${intro} Para cuidados faciais, a avaliacao ajuda a entender pele, sensibilidade e objetivo. Voce quer tratar manchas, acne, textura, limpeza de pele ou rejuvenescimento?`;
  } else if (message.includes("dor") || message.includes("pos operatorio") || message.includes("pos-operatorio") || message.includes("drenagem")) {
    reply = `${intro} Entendi. Para dor, drenagem ou pos-operatorio, preciso saber qual regiao e quando comecou. Voce ja esta em acompanhamento medico?`;
  } else if (message.includes("local") || message.includes("endereco") || message.includes("onde")) {
    reply = `${intro} Atendemos em Manaus. Posso confirmar o endereco e o melhor horario com a equipe. Voce quer agendar uma avaliacao?`;
  } else if (message.includes("humano") || message.includes("atendente") || message.includes("pessoa")) {
    reply = `${intro} Claro, vou chamar uma pessoa da equipe para continuar com voce. Enquanto isso, me diga rapidinho qual e o assunto do atendimento.`;
  }

  return {
    mode: "assisted",
    reply,
    payload
  };
}

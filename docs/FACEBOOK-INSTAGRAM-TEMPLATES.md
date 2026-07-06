# Facebook e Instagram: mensagens fora de 24h

## Regra pratica

Facebook Messenger e Instagram Messaging nao usam o mesmo fluxo de "templates aprovados" do WhatsApp. Para estes canais, a aprovacao relevante na Meta e de permissoes e uso:

* `pages_messaging` para Messenger;
* `instagram_manage_messages` para Instagram Messaging;
* `human_agent` para permitir atendimento humano alem da janela padrao, quando aprovado.

O arquivo `config/facebook-instagram-message-templates.json` guarda os textos aprovaveis internamente e a justificativa para App Review.

Referencias oficiais:

* Messenger Platform Policy Overview: https://developers.facebook.com/docs/messenger-platform/policy/policy-overview/
* Messenger message tags: https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags/
* Instagram Messaging Human Agent: https://developers.facebook.com/docs/messenger-platform/instagram/features/human-agent/

## Janelas

* 0 a 24 horas depois da ultima mensagem do usuario: usar `messaging_type: "RESPONSE"`.
* Depois de 24 horas, ate o limite permitido para atendimento humano: usar tag `HUMAN_AGENT`, somente quando a permissao estiver aprovada e a mensagem for enviada por humano.
* Fora disso: nao enviar texto livre. Pedir novo opt-in, usar recurso permitido do canal, ou criar tarefa para atendimento manual.

## Textos base

### `retorno_atendimento`

Uso: continuar atendimento iniciado pela pessoa.

```text
Ola {{nome}}, aqui e da Fisiolipo. Vi seu interesse em {{interesse}} e posso continuar seu atendimento por aqui. Quer que eu te ajude?
```

### `confirmacao_agendamento`

Uso: confirmar ou ajustar horario pedido pela pessoa.

```text
Ola {{nome}}, seu atendimento na Fisiolipo esta previsto para {{data_hora}}. Se precisar ajustar o horario, responda esta mensagem.
```

### `reagendamento`

Uso: retomar conversa quando a pessoa pediu agenda, mas ainda nao escolheu horario.

```text
Ola {{nome}}, temos disponibilidade para continuar seu atendimento sobre {{interesse}}. Posso te mostrar os horarios?
```

### `pos_atendimento`

Uso: acompanhar pessoa depois de atendimento ou avaliacao ja solicitada.

```text
Ola {{nome}}, passando para acompanhar seu atendimento sobre {{interesse}}. Ficou alguma duvida que eu possa te ajudar?
```

### `documentos_orientacoes`

Uso: enviar orientacao operacional combinada no atendimento.

```text
Ola {{nome}}, conforme seu atendimento na Fisiolipo, posso te enviar as orientacoes sobre {{assunto}} por aqui?
```

## Texto para App Review da Meta

### Justificativa do negocio

```text
A Fisiolipo usa Facebook Messenger e Instagram Messaging para continuar atendimentos iniciados por pacientes e leads que chamaram a clinica. A equipe humana precisa responder duvidas, confirmar horarios e acompanhar solicitacoes quando a conversa passa da janela padrao de 24 horas.
```

### Justificativa do Human Agent

```text
As mensagens com HUMAN_AGENT serao usadas apenas por atendentes humanos para dar continuidade a conversas iniciadas pelo usuario. Nao serao usadas para disparos promocionais, automacao em massa ou mensagens sem contexto.
```

### Passos para avaliacao

```text
1. Abrir o CRM da Fisiolipo.
2. Entrar em uma conversa de Facebook ou Instagram iniciada pelo usuario.
3. Responder dentro da janela padrao usando messaging_type RESPONSE.
4. Simular conversa com mais de 24 horas e responder usando tag HUMAN_AGENT somente com acao humana.
5. Confirmar que mensagens promocionais ou sem opt-in nao sao enviadas fora da janela permitida.
```

## Implementacao pendente no CRM

* calcular a idade da ultima mensagem inbound do usuario;
* usar `RESPONSE` ate 24h;
* usar `HUMAN_AGENT` depois de 24h apenas se a permissao estiver ativa;
* bloquear ou marcar como falha qualquer envio fora da politica permitida;
* mostrar no chat quando a conversa exige novo opt-in ou acao manual.

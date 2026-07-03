# Fisiolipo CRM - Instrucoes para Codex

## Missao

Construir e manter um CRM premium, seguro e facil de evoluir para gestao de leads, chat, vendas, agente automatizada e performance de anuncios da Fisiolipo.

## Forma de trabalho

* Trabalhar em etapas pequenas.
* Explicar cada etapa antes de executar.
* Informar arquivos criados/alterados.
* Pedir somente as informacoes realmente necessarias.
* Nao inventar credenciais.
* Nao fazer deploy sem validacao.
* Nao quebrar funcionalidades existentes.
* Antes de qualquer mudanca grande, verificar estrutura atual.
* Sempre manter codigo simples, modular e documentado.

## Qualidade obrigatoria

* TypeScript sem erros.
* Componentes reutilizaveis.
* Separacao clara entre UI, servicos, regras de negocio e tipos.
* Nenhum arquivo grande e baguncado.
* Cada modulo deve ter sua pasta dentro de features/.
* Criar tipos compartilhados quando necessario.
* Criar documentacao sempre que uma integracao importante for implementada.

## Seguranca obrigatoria

* Nunca expor SUPABASE_SERVICE_ROLE_KEY no frontend.
* Nunca salvar secrets em arquivos versionados.
* Validar .gitignore antes do primeiro commit.
* Bloquear commit se .secrets/ estiver rastreado.
* Usar RLS em todas as tabelas expostas no Supabase.
* Dados sensiveis de leads devem ser protegidos por perfil de usuario.
* Logs nao podem mostrar telefone completo, tokens ou dados sensiveis quando nao for necessario.

## Design

* Visual premium.
* Cores principais: rosa e branco.
* Modo escuro obrigatorio.
* Menu lateral fixo.
* Layout responsivo.
* Animacoes suaves.
* Dashboard elegante, com cards, graficos e hierarquia clara.
* Evitar aparencia generica, infantil ou amadora.

## Chat

O chat deve funcionar visualmente e operacionalmente como um WhatsApp interno, com conversas, mensagens em bolhas, midias, status, notas internas, respostas rapidas, transferencia, venda, perda, retorno, busca e paginacao.

## Agente automatizada

A agente deve atender leads, qualificar intencao, registrar memoria e resumo, respeitar guardrails, chamar humano quando necessario e nunca prometer resultado medico, preco ou condicao nao cadastrada.

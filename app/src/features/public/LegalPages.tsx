type LegalPageKind = "data-deletion" | "privacy" | "terms";

type LegalPageProps = {
  kind: LegalPageKind;
};

const content = {
  privacy: {
    title: "Politica de Privacidade",
    subtitle: "Como o CRM Beleza Manaus trata dados de clientes, leads e usuarios.",
    sections: [
      {
        heading: "Dados coletados",
        text: "Coletamos dados fornecidos por formularios, mensagens e atendimentos, como nome, telefone, e-mail, origem do lead, mensagens enviadas, anexos recebidos e historico comercial."
      },
      {
        heading: "Uso dos dados",
        text: "Usamos os dados para atendimento comercial, organizacao de leads, acompanhamento de conversas, agendamentos, vendas, suporte e melhoria dos processos internos da Beleza Manaus."
      },
      {
        heading: "Integrações Meta",
        text: "Quando conectados, Facebook Messenger, Instagram Direct e WhatsApp Cloud API podem enviar mensagens, midias e eventos para o CRM. Mensagens ficam em banco operacional D1 e dados principais do CRM ficam no Supabase."
      },
      {
        heading: "Compartilhamento",
        text: "Os dados nao sao vendidos. Podem ser processados por provedores necessarios para operar o sistema, como Cloudflare, Supabase e Meta, sempre para fins de funcionamento do atendimento."
      },
      {
        heading: "Contato",
        text: "Para solicitacoes sobre privacidade, envie e-mail para contato.thiagordesigner@gmail.com."
      }
    ]
  },
  terms: {
    title: "Termos de Servico",
    subtitle: "Regras de uso do CRM Beleza Manaus.",
    sections: [
      {
        heading: "Uso autorizado",
        text: "O sistema deve ser usado pela equipe autorizada da Beleza Manaus para gestao de leads, conversas, campanhas, atendimentos, vendas e configuracoes comerciais."
      },
      {
        heading: "Responsabilidades",
        text: "Os usuarios devem manter credenciais seguras, respeitar a privacidade dos clientes e usar as informacoes somente para fins de atendimento e operacao da empresa."
      },
      {
        heading: "Canais integrados",
        text: "Ao conectar Facebook, Instagram ou WhatsApp, a empresa declara ter permissao para administrar os canais e responder aos clientes de acordo com as politicas da Meta."
      },
      {
        heading: "Disponibilidade",
        text: "O sistema depende de servicos externos como Cloudflare, Supabase e Meta. Podem ocorrer indisponibilidades, limitacoes de API ou necessidade de revisao de permissoes."
      },
      {
        heading: "Contato",
        text: "Duvidas sobre estes termos podem ser enviadas para contato.thiagordesigner@gmail.com."
      }
    ]
  },
  "data-deletion": {
    title: "Exclusao de Dados do Usuario",
    subtitle: "Instrucoes para solicitar remocao de dados pessoais.",
    sections: [
      {
        heading: "Como solicitar",
        text: "Envie um e-mail para contato.thiagordesigner@gmail.com com o assunto 'Exclusao de dados - Beleza Manaus'. Informe nome, telefone, e-mail e canal usado no atendimento."
      },
      {
        heading: "Prazo",
        text: "A solicitacao sera analisada e respondida em ate 15 dias uteis, salvo obrigacoes legais, fiscais ou operacionais que exijam retencao por periodo maior."
      },
      {
        heading: "Dados removidos",
        text: "Podem ser removidos dados de contato, historico de mensagens, anexos, notas e registros comerciais vinculados ao solicitante, conforme viabilidade tecnica e legal."
      },
      {
        heading: "Dados de plataformas",
        text: "Dados mantidos diretamente no Facebook, Instagram ou WhatsApp tambem podem exigir solicitacao nas configuracoes da propria plataforma Meta."
      }
    ]
  }
} satisfies Record<LegalPageKind, { sections: Array<{ heading: string; text: string }>; subtitle: string; title: string }>;

export function LegalPage({ kind }: LegalPageProps) {
  const page = content[kind];

  return (
    <main className="min-h-screen bg-rosebrand-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <article className="mx-auto max-w-3xl rounded-lg border border-rosebrand-100 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <p className="text-sm font-semibold text-rosebrand-600">CRM Beleza Manaus</p>
        <h1 className="mt-2 text-3xl font-bold">{page.title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{page.subtitle}</p>
        <div className="mt-8 space-y-6">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{section.text}</p>
            </section>
          ))}
        </div>
        <footer className="mt-8 border-t border-rosebrand-100 pt-5 text-sm text-zinc-500 dark:border-zinc-800">
          Ultima atualizacao: 03/07/2026
        </footer>
      </article>
    </main>
  );
}

export function getLegalPageKind(pathname: string): LegalPageKind | null {
  if (pathname === "/politica-de-privacidade") return "privacy";
  if (pathname === "/termos-de-servico") return "terms";
  if (pathname === "/exclusao-de-dados") return "data-deletion";
  return null;
}

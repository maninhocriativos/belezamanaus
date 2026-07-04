import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "../components/layout/AppShell";
import { AgentSettingsForm } from "../components/ui/AgentSettingsForm";
import { CampaignPerformanceTable } from "../components/ui/CampaignPerformanceTable";
import { ChartCard } from "../components/charts/ChartCard";
import { ConversationList, type ChatConversation } from "../components/ui/ConversationList";
import { LeadDetailsPanel } from "../components/ui/LeadDetailsPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SaleForm } from "../components/ui/SaleForm";
import { LoginView } from "../features/auth/LoginView";
import { OnboardingView } from "../features/auth/OnboardingView";
import { ChatWindow } from "../features/chat/ChatWindow";
import { getLegalPageKind, LegalPage } from "../features/public/LegalPages";
import { supabase } from "../lib/supabase";
import { appEnv } from "../lib/env";
import { apiFetch } from "../services/api";
import { getActiveAgentProfile, listCampaigns, listLeads, listProcedures, type CrmLead } from "../services/crm-data";
import type { AppPage } from "../types/domain";
import { useEffect } from "react";

export function App() {
  const legalPageKind = getLegalPageKind(window.location.pathname);
  const [activePage, setActivePageState] = useState<AppPage>(() => {
    const stored = window.localStorage.getItem("crm_active_page") as AppPage | null;
    return stored ?? "dashboard";
  });
  const [session, setSession] = useState<Session | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loadingSession, setLoadingSession] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setProfileComplete(Boolean(data.session?.user.user_metadata?.crm_profile_complete));
      setLoadingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfileComplete(Boolean(nextSession?.user.user_metadata?.crm_profile_complete));
      setLoadingSession(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setProfileComplete(false);
    setDemoMode(false);
    setActivePage("dashboard");
  }

  function setActivePage(page: AppPage) {
    setActivePageState(page);
    window.localStorage.setItem("crm_active_page", page);
  }

  if (legalPageKind) {
    return <LegalPage kind={legalPageKind} />;
  }

  if (loadingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-rosebrand-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <p className="text-sm font-semibold text-rosebrand-700">Carregando sessao...</p>
      </main>
    );
  }

  if (!session && !demoMode) {
    return <LoginView onDemoAccess={() => setDemoMode(true)} />;
  }

  if (session && !demoMode && !profileComplete) {
    return <OnboardingView onComplete={() => setProfileComplete(true)} session={session} />;
  }

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage} onSignOut={handleSignOut}>
      {activePage === "dashboard" && <DashboardView />}
      {activePage === "leads" && <LeadsView />}
      {activePage === "chat" && <ChatView />}
      {activePage === "sales" && <SalesView />}
      {activePage === "campaigns" && <CampaignsView />}
      {activePage === "adsPerformance" && <AdsPerformanceView />}
      {activePage === "agent" && <AgentView />}
      {activePage === "reports" && <ReportsView />}
      {activePage === "settings" && <SettingsView />}
    </AppShell>
  );
}

function DashboardView() {
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [procedureCount, setProcedureCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([listLeads(), listCampaigns(), listProcedures()])
      .then(([leads, campaigns, procedures]) => {
        setLeadCount(leads.length);
        setCampaignCount(campaigns.length);
        setProcedureCount(procedures.length);
      })
      .catch(() => {
        setLeadCount(0);
        setCampaignCount(0);
        setProcedureCount(0);
      });
  }, []);

  const liveMetrics = [
    { label: "Leads no Supabase", value: leadCount === null ? "..." : String(leadCount), trend: "banco principal" },
    { label: "Campanhas", value: campaignCount === null ? "..." : String(campaignCount), trend: "Meta/CRM" },
    { label: "Procedimentos", value: procedureCount === null ? "..." : String(procedureCount), trend: "ativos" },
    { label: "Mensagens", value: "D1", trend: "banco separado" }
  ];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {liveMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Leads e vendas por dia" />
        <CampaignPerformanceTable />
      </section>
    </>
  );
}

function ChatView() {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation>({
    id: "marina-alves",
    last_message: "Quero saber sobre avaliacao",
    last_message_at: new Date().toISOString(),
    last_message_type: "text",
    lead_id: "lead-marina-alves",
    sender_type: "meta",
    status: "open"
  });

  return (
    <section className="grid h-full min-h-0 w-full overflow-hidden border-t border-rosebrand-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
      <ConversationList onSelect={setSelectedConversation} selectedConversationId={selectedConversation.id} />
      <ChatWindow conversationId={selectedConversation.id} leadId={selectedConversation.lead_id} />
      <LeadDetailsPanel />
    </section>
  );
}

function LeadsView() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLeads()
      .then(setLeads)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Leads</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["Buscar por nome", "Status", "Campanha", "Temperatura"].map((placeholder) => (
            <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" key={placeholder} placeholder={placeholder} />
          ))}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr><th>Lead</th><th>Telefone</th><th>Status</th><th>Campanha</th><th>Score</th></tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800">
                  <td className="py-3 pr-3 text-zinc-500" colSpan={5}>Carregando leads do Supabase...</td>
                </tr>
              )}
              {!loading && leads.map((lead) => (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={lead.id}>
                  <td className="py-3 pr-3 font-medium">{lead.full_name}</td>
                  <td className="py-3 pr-3">{lead.phone}</td>
                  <td className="py-3 pr-3">{lead.status}</td>
                  <td className="py-3 pr-3">{lead.meta_campaign_name ?? lead.source}</td>
                  <td className="py-3 pr-3">{lead.lead_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <LeadDetailsPanel />
    </section>
  );
}

function SalesView() {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <SaleForm />
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Vendas efetuadas</h3>
        <p className="mt-4 text-3xl font-bold">R$ 18.900,00</p>
        <p className="mt-1 text-sm text-zinc-500">Total mockado ate conectar Supabase.</p>
      </div>
    </section>
  );
}

function CampaignsView() {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <CampaignPerformanceTable />
      <ChartCard title="Leads por campanha" />
    </section>
  );
}

function AdsPerformanceView() {
  return (
    <section className="grid gap-5">
      <CampaignPerformanceTable />
      <ChartCard title="Conversao por anuncio" />
    </section>
  );
}

function AgentView() {
  const [agentName, setAgentName] = useState("Aline");
  const [agentTone, setAgentTone] = useState("acolhedor, consultivo e objetivo");
  const [agentMessage, setAgentMessage] = useState("Carregando configuracao da agente...");

  useEffect(() => {
    getActiveAgentProfile().then((agent) => {
      if (!agent) return;
      setAgentName(agent.name);
      setAgentTone(agent.tone ?? "");
      setAgentMessage(agent.initial_message ?? "");
    });
  }, []);

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <AgentSettingsForm />
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Agente ativa: {agentName}</h3>
        <p className="mt-2 text-sm text-zinc-500">Tom: {agentTone}</p>
        <textarea className="mt-4 min-h-56 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" value={agentMessage} readOnly />
      </div>
    </section>
  );
}

function ReportsView() {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <MetricCard label="Melhor campanha" value="Remarketing" trend="4.1x ROAS" />
      <MetricCard label="Pior campanha" value="Lead Forms" trend="alto CPL" />
      <MetricCard label="Tempo medio resposta" value="3m 12s" trend="-18%" />
    </section>
  );
}

function SettingsView() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("agent");
  const [userPassword, setUserPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  function validateStrongPassword(value: string) {
    if (value.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
    if (!/[A-Z]/.test(value)) return "A senha precisa ter pelo menos uma letra maiuscula.";
    if (!/[a-z]/.test(value)) return "A senha precisa ter pelo menos uma letra minuscula.";
    if (!/\d/.test(value)) return "A senha precisa ter pelo menos um numero.";
    return "";
  }

  async function updatePassword() {
    if (!supabase) {
      setSettingsMessage("Supabase nao esta configurado.");
      return;
    }

    if (!currentPassword) {
      setSettingsMessage("Informe a senha atual para confirmar a troca.");
      return;
    }

    const validation = validateStrongPassword(newPassword);
    if (validation) {
      setSettingsMessage(validation);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setSettingsMessage("A confirmacao da senha nao confere.");
      return;
    }

    setSavingSettings(true);
    setSettingsMessage("");

    const session = (await supabase.auth.getSession()).data.session;
    const email = session?.user.email;
    if (!email) {
      setSavingSettings(false);
      setSettingsMessage("Sessao expirada. Entre novamente.");
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) {
      setSavingSettings(false);
      setSettingsMessage("Senha atual invalida.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingSettings(false);
    setSettingsMessage(error ? error.message : "Senha redefinida com sucesso.");

    if (!error) {
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    }
  }

  async function createUser() {
    const validation = validateStrongPassword(userPassword);
    if (validation) {
      setSettingsMessage(validation);
      return;
    }

    if (!userEmail.trim()) {
      setSettingsMessage("Informe o e-mail do novo usuario.");
      return;
    }

    setSavingSettings(true);
    setSettingsMessage("");

    try {
      await apiFetch("/users", {
        body: JSON.stringify({
          email: userEmail,
          fullName: userName,
          password: userPassword,
          role: userRole
        }),
        method: "POST"
      });
      setSettingsMessage("Usuario cadastrado, vinculado ao Supabase e pronto para login.");
      setUserEmail("");
      setUserName("");
      setUserPassword("");
      setUserRole("agent");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Falha ao cadastrar usuario.");
    } finally {
      setSavingSettings(false);
    }
  }

  const metaWebhookUrl = `${appEnv.apiUrl}/webhooks/meta/leads`;

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Conta e seguranca</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Senha atual" type="password" value={currentPassword} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setNewPassword(event.target.value)} placeholder="Nova senha" type="password" value={newPassword} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setNewPasswordConfirm(event.target.value)} placeholder="Confirmar nova senha" type="password" value={newPasswordConfirm} />
        </div>
        <button className="mt-3 rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={savingSettings} onClick={updatePassword} type="button">
          Redefinir minha senha
        </button>
      </div>

      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Usuarios da equipe</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_1fr]">
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setUserName(event.target.value)} placeholder="Nome" value={userName} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setUserEmail(event.target.value)} placeholder="E-mail" type="email" value={userEmail} />
          <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setUserRole(event.target.value)} value={userRole}>
            <option value="agent">Atendente</option>
            <option value="manager">Gestor</option>
            <option value="owner">Administrador</option>
          </select>
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setUserPassword(event.target.value)} placeholder="Senha inicial" type="password" value={userPassword} />
        </div>
        <button className="mt-3 rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={savingSettings} onClick={createUser} type="button">
          Cadastrar usuario
        </button>
      </div>

      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Canais de mensagens</h3>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {[
            ["Instagram Direct", "Conecte o app Meta em Webhooks > Instagram > messages."],
            ["Facebook Messenger", "Conecte o app Meta em Webhooks > Page > messages."],
            ["WhatsApp Cloud API", "Conecte o app Meta em Webhooks > WhatsApp Business Account > messages."]
          ].map(([title, description]) => (
            <div className="rounded-lg border border-rosebrand-100 p-4 dark:border-zinc-800" key={title}>
              <h4 className="font-semibold">{title}</h4>
              <p className="mt-2 text-sm text-zinc-500">{description}</p>
            </div>
          ))}
        </div>
        <label className="mt-4 block text-sm font-medium">Webhook unico para Meta</label>
        <input className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-rosebrand-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" readOnly value={metaWebhookUrl} />
        <p className="mt-2 text-sm text-zinc-500">Use o mesmo Verify Token salvo em META_VERIFY_TOKEN. As mensagens entram no D1; leads, usuarios e configuracoes continuam no Supabase.</p>
      </div>

      {settingsMessage && <p className="rounded-lg border border-rosebrand-100 bg-white px-4 py-3 text-sm text-zinc-700 shadow-soft dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">{settingsMessage}</p>}
    </section>
  );
}

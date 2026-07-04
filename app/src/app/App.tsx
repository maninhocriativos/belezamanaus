import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "../components/layout/AppShell";
import { AgentSettingsForm } from "../components/ui/AgentSettingsForm";
import { CampaignPerformanceTable, type CampaignPerformanceRow } from "../components/ui/CampaignPerformanceTable";
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
import { getActiveAgentProfile, listCampaigns, listLeads, listProcedures, listSales, type CrmAgentProfile, type CrmCampaign, type CrmLead, type CrmProcedure, type CrmSale } from "../services/crm-data";
import type { AppPage } from "../types/domain";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(value);
}

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function shortDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value.slice(5);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function buildDailyBars(leads: CrmLead[], sales: CrmSale[]) {
  const totals = new Map<string, number>();
  for (const lead of leads) {
    const key = dateKey(lead.created_at);
    if (key) totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  for (const sale of sales) {
    const key = dateKey(sale.created_at);
    if (key) totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([label, value]) => ({ label: shortDay(label), value }));
}

function buildCampaignRows(campaigns: CrmCampaign[], leads: CrmLead[], sales: CrmSale[]): CampaignPerformanceRow[] {
  return campaigns.map((campaign) => {
    const campaignLeads = leads.filter((lead) => (lead.meta_campaign_name ?? lead.source ?? "").toLowerCase() === campaign.name.toLowerCase());
    const campaignSales = sales.filter((sale) => campaignLeads.some((lead) => lead.id === sale.lead_id));
    const revenue = campaignSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

    return {
      campaign: campaign.name,
      cpl: campaignLeads.length ? "calc. Meta" : "-",
      leads: campaignLeads.length,
      roas: revenue > 0 ? "Meta pendente" : "-",
      sales: campaignSales.length
    };
  });
}

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
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<CrmProcedure[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([listLeads(), listCampaigns(), listProcedures(), listSales()])
      .then(([nextLeads, nextCampaigns, nextProcedures, nextSales]) => {
        setLeads(nextLeads);
        setCampaigns(nextCampaigns);
        setProcedures(nextProcedures);
        setSales(nextSales);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const liveMetrics = [
    { label: "Leads hoje", value: loading ? "..." : String(leads.filter((lead) => dateKey(lead.created_at) === today).length), trend: "Supabase" },
    { label: "Leads totais", value: loading ? "..." : String(leads.length), trend: "CRM" },
    { label: "Vendas", value: loading ? "..." : String(sales.length), trend: currency(revenue) },
    { label: "Procedimentos", value: loading ? "..." : String(procedures.filter((procedure) => procedure.active).length), trend: "ativos" }
  ];
  const campaignRows = buildCampaignRows(campaigns, leads, sales);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {liveMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard bars={buildDailyBars(leads, sales)} title="Leads e vendas por dia" />
        <CampaignPerformanceTable rows={campaignRows} />
      </section>
    </>
  );
}

function ChatView() {
  const [selectedConversation, setSelectedConversationState] = useState<ChatConversation>(() => {
    const stored = window.localStorage.getItem("crm_selected_conversation");
    if (stored) {
      try {
        return JSON.parse(stored) as ChatConversation;
      } catch {
        window.localStorage.removeItem("crm_selected_conversation");
      }
    }

    return {
      id: "marina-alves",
      last_message: "Quero saber sobre avaliacao",
      last_message_at: new Date().toISOString(),
      last_message_type: "text",
      lead_id: "lead-marina-alves",
      sender_type: "meta",
      status: "open"
    };
  });

  const setSelectedConversation = useCallback((conversation: ChatConversation) => {
    setSelectedConversationState((current) => {
      if (JSON.stringify(current) === JSON.stringify(conversation)) return current;
      window.localStorage.setItem("crm_selected_conversation", JSON.stringify(conversation));
      return conversation;
    });
  }, []);

  return (
    <section className="grid h-full min-h-0 w-full overflow-hidden border-t border-rosebrand-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
      <ConversationList onSelect={setSelectedConversation} selectedConversationId={selectedConversation.id} />
      <ChatWindow
        contact={{
          avatarUrl: selectedConversation.contact_avatar_url,
          channel: selectedConversation.channel,
          isTyping: selectedConversation.is_typing,
          name: selectedConversation.contact_name,
          phone: selectedConversation.contact_phone,
          presenceStatus: selectedConversation.presence_status
        }}
        conversationId={selectedConversation.id}
        leadId={selectedConversation.lead_id}
      />
      <LeadDetailsPanel conversation={selectedConversation} />
    </section>
  );
}

function LeadsView() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [temperatureFilter, setTemperatureFilter] = useState("");

  useEffect(() => {
    listLeads()
      .then(setLeads)
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : "Nao foi possivel carregar leads."))
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const campaign = lead.meta_campaign_name ?? lead.source ?? "";
    const matchesQuery = [lead.full_name, lead.phone ?? ""].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = !statusFilter || lead.status.toLowerCase().includes(statusFilter.toLowerCase());
    const matchesCampaign = !campaignFilter || campaign.toLowerCase().includes(campaignFilter.toLowerCase());
    const matchesTemperature = !temperatureFilter || lead.temperature.toLowerCase().includes(temperatureFilter.toLowerCase());
    return matchesQuery && matchesStatus && matchesCampaign && matchesTemperature;
  });

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Leads</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" value={query} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setStatusFilter(event.target.value)} placeholder="Status" value={statusFilter} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setCampaignFilter(event.target.value)} placeholder="Campanha" value={campaignFilter} />
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setTemperatureFilter(event.target.value)} placeholder="Temperatura" value={temperatureFilter} />
        </div>
        {error && <p className="mt-3 rounded-lg bg-rosebrand-50 px-3 py-2 text-sm text-rosebrand-700">{error}</p>}
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
              {!loading && filteredLeads.map((lead) => (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={lead.id}>
                  <td className="py-3 pr-3 font-medium">{lead.full_name}</td>
                  <td className="py-3 pr-3">{lead.phone}</td>
                  <td className="py-3 pr-3">{lead.status}</td>
                  <td className="py-3 pr-3">{lead.meta_campaign_name ?? lead.source}</td>
                  <td className="py-3 pr-3">{lead.lead_score}</td>
                </tr>
              ))}
              {!loading && filteredLeads.length === 0 && (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800">
                  <td className="py-3 pr-3 text-zinc-500" colSpan={5}>Nenhum lead encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <LeadDetailsPanel />
    </section>
  );
}

function SalesView() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<CrmProcedure[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([listLeads(), listProcedures(), listSales()])
      .then(([nextLeads, nextProcedures, nextSales]) => {
        setLeads(nextLeads);
        setProcedures(nextProcedures);
        setSales(nextSales);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <SaleForm leads={leads} onCreated={(sale) => setSales((current) => [sale, ...current])} procedures={procedures} />
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Vendas efetuadas</h3>
        <p className="mt-4 text-3xl font-bold">{loading ? "..." : currency(total)}</p>
        <p className="mt-1 text-sm text-zinc-500">{sales.length} vendas registradas no Supabase.</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr><th>Procedimento</th><th>Valor</th><th>Pagamento</th><th>Status</th></tr>
            </thead>
            <tbody>
              {!loading && sales.length === 0 && (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800">
                  <td className="py-3 pr-3 text-zinc-500" colSpan={4}>Nenhuma venda registrada ainda.</td>
                </tr>
              )}
              {sales.map((sale) => (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={sale.id}>
                  <td className="py-3 pr-3">{sale.procedure_name}</td>
                  <td className="py-3 pr-3">{currency(Number(sale.amount || 0))}</td>
                  <td className="py-3 pr-3">{sale.payment_method ?? "-"}</td>
                  <td className="py-3 pr-3">{sale.sale_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CampaignsView() {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([listCampaigns(), listLeads(), listSales()]).then(([nextCampaigns, nextLeads, nextSales]) => {
      setCampaigns(nextCampaigns);
      setLeads(nextLeads);
      setSales(nextSales);
    });
  }, []);

  const rows = buildCampaignRows(campaigns, leads, sales);

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <CampaignPerformanceTable rows={rows} />
      <ChartCard bars={rows.map((row) => ({ label: row.campaign.slice(0, 10), value: row.leads }))} title="Leads por campanha" />
    </section>
  );
}

function AdsPerformanceView() {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([listCampaigns(), listLeads(), listSales()]).then(([nextCampaigns, nextLeads, nextSales]) => {
      setCampaigns(nextCampaigns);
      setLeads(nextLeads);
      setSales(nextSales);
    });
  }, []);

  const rows = buildCampaignRows(campaigns, leads, sales);

  return (
    <section className="grid gap-5">
      <CampaignPerformanceTable rows={rows} />
      <ChartCard bars={rows.map((row) => ({ label: row.campaign.slice(0, 10), value: row.sales }))} note="vendas por campanha" title="Conversao por anuncio" />
    </section>
  );
}

function AgentView() {
  const [agent, setAgent] = useState<CrmAgentProfile | null>(null);
  const agentName = agent?.name ?? "Aline";
  const agentTone = agent?.tone ?? "acolhedor, consultivo e objetivo";
  const agentMessage = agent?.initial_message ?? "Cadastre a mensagem inicial da agente.";

  useEffect(() => {
    getActiveAgentProfile().then((agent) => {
      if (!agent) return;
      setAgent(agent);
    });
  }, []);

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <AgentSettingsForm agent={agent} onSaved={setAgent} />
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Agente ativa: {agentName}</h3>
        <p className="mt-2 text-sm text-zinc-500">Tom: {agentTone}</p>
        <textarea className="mt-4 min-h-56 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" value={agentMessage} readOnly />
      </div>
    </section>
  );
}

function ReportsView() {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([listCampaigns(), listLeads(), listSales()]).then(([nextCampaigns, nextLeads, nextSales]) => {
      setCampaigns(nextCampaigns);
      setLeads(nextLeads);
      setSales(nextSales);
    });
  }, []);

  const rows = buildCampaignRows(campaigns, leads, sales);
  const bestCampaign = [...rows].sort((a, b) => b.sales - a.sales || b.leads - a.leads)[0];
  const pendingLeads = leads.filter((lead) => !["sold", "lost"].includes(lead.status)).length;
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const conversion = leads.length ? `${((sales.length / leads.length) * 100).toFixed(1)}%` : "0%";

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <MetricCard label="Melhor campanha" value={bestCampaign?.campaign ?? "-"} trend={`${bestCampaign?.sales ?? 0} vendas`} />
      <MetricCard label="Leads em aberto" value={String(pendingLeads)} trend={`${leads.length} totais`} />
      <MetricCard label="Conversao geral" value={conversion} trend={currency(revenue)} />
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

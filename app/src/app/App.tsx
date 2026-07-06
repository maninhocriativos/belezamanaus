import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Facebook, Instagram, MessageCircle, Phone } from "lucide-react";
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

type ChatMetrics = {
  channels: Record<string, number>;
  organic: number;
  total: number;
  traffic: number;
};

type MetaAdInsight = {
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  clicks?: string;
  impressions?: string;
  spend?: string;
};

type MetaAdsInsightsResponse = {
  campaigns: MetaAdInsight[];
  mode: "meta" | "meta-error" | "not-configured" | "placeholder";
  range?: string;
};

function buildMetaAdRows(insights: MetaAdInsight[]): CampaignPerformanceRow[] {
  return insights.map((item) => {
    const clicks = Number(item.clicks || 0);
    const spend = Number(item.spend || 0);
    return {
      campaign: item.ad_name || item.campaign_name || item.ad_id || "Anuncio",
      cpl: clicks > 0 ? currency(spend / clicks) : "-",
      leads: clicks,
      roas: spend > 0 ? currency(spend) : "-",
      sales: 0
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
      {activePage === "leads" && <LeadsView onOpenConversation={(conversation) => {
        window.localStorage.setItem("crm_selected_conversation", JSON.stringify(conversation));
        setActivePage("chat");
      }} />}
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
  const [chatMetrics, setChatMetrics] = useState<ChatMetrics | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<CrmProcedure[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([
      listLeads(),
      listCampaigns(),
      listProcedures(),
      listSales(),
      apiFetch<ChatMetrics>("/chat/metrics").catch(() => null)
    ])
      .then(([nextLeads, nextCampaigns, nextProcedures, nextSales, nextChatMetrics]) => {
        setLeads(nextLeads);
        setCampaigns(nextCampaigns);
        setProcedures(nextProcedures);
        setSales(nextSales);
        setChatMetrics(nextChatMetrics);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const liveMetrics = [
    { label: "Usuarios reais", value: loading ? "..." : String(chatMetrics?.total ?? leads.length), trend: "Chat" },
    { label: "Trafego pago", value: loading ? "..." : String(chatMetrics?.traffic ?? 0), trend: "anuncios" },
    { label: "Mensagem normal", value: loading ? "..." : String(chatMetrics?.organic ?? 0), trend: "organico" },
    { label: "Vendas", value: loading ? "..." : String(sales.length), trend: currency(revenue) }
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

function leadDisplayName(conversation: ChatConversation) {
  if (conversation.contact_name) return conversation.contact_name;
  const [channel, identifier] = conversation.id.includes(":") ? conversation.id.split(":") : ["crm", conversation.id];
  if (channel === "instagram") return `Instagram ${identifier}`;
  if (channel === "facebook") return `Facebook ${identifier}`;
  if (channel === "whatsapp") return `WhatsApp ${identifier}`;
  return identifier.replace(/-/g, " ");
}

function leadChannelLabel(conversation: ChatConversation) {
  if (conversation.channel === "instagram" || conversation.id.startsWith("instagram:")) return "Instagram";
  if (conversation.channel === "facebook" || conversation.id.startsWith("facebook:")) return "Facebook";
  if (conversation.channel === "whatsapp" || conversation.id.startsWith("whatsapp:")) return "WhatsApp";
  return "CRM";
}

function leadSourceLabel(conversation: ChatConversation) {
  if (conversation.source_type === "traffic") return conversation.ad_code ? `Trafego pago · ${conversation.ad_code}` : "Trafego pago";
  return conversation.source_label || "Mensagem normal";
}

function leadChannelIcon(conversation: ChatConversation) {
  const channel = leadChannelLabel(conversation);
  if (channel === "Instagram") return Instagram;
  if (channel === "Facebook") return Facebook;
  return Phone;
}

function LeadsView({ onOpenConversation }: { onOpenConversation: (conversation: ChatConversation) => void }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  useEffect(() => {
    apiFetch<{ conversations: ChatConversation[] }>("/chat/conversations")
      .then((data) => setConversations(data.conversations.filter((conversation) => {
        const channel = leadChannelLabel(conversation);
        return channel === "Instagram" || channel === "Facebook" || channel === "WhatsApp";
      })))
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : "Nao foi possivel carregar usuarios reais."))
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = conversations.filter((conversation) => {
    const haystack = [
      leadDisplayName(conversation),
      conversation.contact_phone ?? "",
      conversation.lead_id,
      leadChannelLabel(conversation),
      leadSourceLabel(conversation)
    ].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesSource = !sourceFilter || (conversation.source_type ?? "organic") === sourceFilter;
    return matchesQuery && matchesSource;
  });

  return (
    <section className="space-y-5">
      <div className="border-b border-rosebrand-100 pb-4 dark:border-zinc-800">
        <h3 className="text-base font-semibold">Usuarios reais</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome, telefone, Instagram ou Facebook" value={query} />
          <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setSourceFilter(event.target.value)} value={sourceFilter}>
            <option value="">Todas as origens</option>
            <option value="traffic">Trafego pago</option>
            <option value="organic">Mensagem normal</option>
          </select>
        </div>
        {error && <p className="mt-3 rounded-lg bg-rosebrand-50 px-3 py-2 text-sm text-rosebrand-700">{error}</p>}
      </div>

      {loading && <p className="text-sm text-zinc-500">Carregando usuarios reais...</p>}
      {!loading && filteredLeads.length === 0 && <p className="text-sm text-zinc-500">Nenhum usuario encontrado.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredLeads.map((conversation) => {
          const ChannelIcon = leadChannelIcon(conversation);
          return (
            <article className="rounded-lg border border-rosebrand-100 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900" key={conversation.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rosebrand-100 text-rosebrand-700">
                    <ChannelIcon size={18} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold">{leadDisplayName(conversation)}</h4>
                    <p className="truncate text-xs text-zinc-500">{leadChannelLabel(conversation)} · {leadSourceLabel(conversation)}</p>
                  </div>
                </div>
                <button className="grid size-9 shrink-0 place-items-center rounded-lg bg-rosebrand-600 text-white hover:bg-rosebrand-700" onClick={() => onOpenConversation(conversation)} title="Abrir conversa" type="button">
                  <MessageCircle size={17} />
                </button>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <p><strong>Telefone:</strong> {conversation.contact_phone || "nao informado"}</p>
                <p><strong>ID:</strong> {conversation.lead_id}</p>
                <p><strong>Status:</strong> {conversation.status}</p>
                <p className="truncate"><strong>Ultima mensagem:</strong> {conversation.last_message || "sem mensagem"}</p>
              </div>
            </article>
          );
        })}
      </div>
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
  const [insights, setInsights] = useState<MetaAdsInsightsResponse | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);

  useEffect(() => {
    Promise.all([
      listCampaigns(),
      listLeads(),
      listSales(),
      apiFetch<MetaAdsInsightsResponse>("/meta/ads-insights").catch(() => null)
    ]).then(([nextCampaigns, nextLeads, nextSales, nextInsights]) => {
      setCampaigns(nextCampaigns);
      setLeads(nextLeads);
      setSales(nextSales);
      setInsights(nextInsights);
    });
  }, []);

  const metaRows = insights?.mode === "meta" ? buildMetaAdRows(insights.campaigns) : [];
  const rows = metaRows.length ? metaRows : buildCampaignRows(campaigns, leads, sales);
  const totalClicks = insights?.campaigns.reduce((sum, item) => sum + Number(item.clicks || 0), 0) ?? 0;
  const totalSpend = insights?.campaigns.reduce((sum, item) => sum + Number(item.spend || 0), 0) ?? 0;
  const totalImpressions = insights?.campaigns.reduce((sum, item) => sum + Number(item.impressions || 0), 0) ?? 0;

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Origem" value={insights?.mode === "meta" ? "Meta real" : "Dados internos"} trend={insights?.mode ?? "carregando"} />
        <MetricCard label="Cliques" value={String(totalClicks)} trend={`${totalImpressions} impressoes`} />
        <MetricCard label="Investimento" value={currency(totalSpend)} trend={insights?.range ?? "ultimos 30 dias"} />
      </div>
      <CampaignPerformanceTable rows={rows} />
      <ChartCard bars={rows.map((row) => ({ label: row.campaign.slice(0, 10), value: metaRows.length ? row.leads : row.sales }))} note={metaRows.length ? "cliques por anuncio" : "vendas por campanha"} title="Conversao por anuncio" />
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

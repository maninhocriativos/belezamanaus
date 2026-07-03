import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppShell } from "../components/layout/AppShell";
import { AgentSettingsForm } from "../components/ui/AgentSettingsForm";
import { CampaignPerformanceTable } from "../components/ui/CampaignPerformanceTable";
import { ChartCard } from "../components/charts/ChartCard";
import { ConversationList } from "../components/ui/ConversationList";
import { LeadDetailsPanel } from "../components/ui/LeadDetailsPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SaleForm } from "../components/ui/SaleForm";
import { LoginView } from "../features/auth/LoginView";
import { OnboardingView } from "../features/auth/OnboardingView";
import { ChatWindow } from "../features/chat/ChatWindow";
import { dashboardMetrics } from "../features/dashboard/dashboard-data";
import { supabase } from "../lib/supabase";
import type { AppPage } from "../types/domain";
import { useEffect } from "react";

export function App() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
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
    <AppShell activePage={activePage} onPageChange={setActivePage}>
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
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
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
  return (
    <section className="grid h-full min-h-0 w-full overflow-hidden border-t border-rosebrand-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
      <ConversationList />
      <ChatWindow />
      <LeadDetailsPanel />
    </section>
  );
}

function LeadsView() {
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
              {[
                ["Marina Alves", "(92) 99999-0001", "Em atendimento", "Avaliacao Julho", "86"],
                ["Claudia N.", "(92) 99999-0002", "Novo", "Lead Forms Manaus", "61"],
                ["Renata Lima", "(92) 99999-0003", "Qualificado", "Remarketing", "78"]
              ].map((row) => (
                <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={row[0]}>
                  {row.map((cell) => <td className="py-3 pr-3" key={cell}>{cell}</td>)}
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
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <AgentSettingsForm />
      <div className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">Base de conhecimento</h3>
        <textarea className="mt-4 min-h-56 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Procedimentos, regras comerciais, perguntas e objecoes" />
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
  return (
    <section className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold">Configuracoes</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" defaultValue="Beleza Manaus" />
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" defaultValue="maninhocriativos@gmail.com" />
      </div>
    </section>
  );
}

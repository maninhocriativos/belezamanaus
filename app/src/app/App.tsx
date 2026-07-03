import { AppShell } from "../components/layout/AppShell";
import { AgentSettingsForm } from "../components/ui/AgentSettingsForm";
import { CampaignPerformanceTable } from "../components/ui/CampaignPerformanceTable";
import { ChartCard } from "../components/charts/ChartCard";
import { ConversationList } from "../components/ui/ConversationList";
import { LeadDetailsPanel } from "../components/ui/LeadDetailsPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { SaleForm } from "../components/ui/SaleForm";
import { ChatWindow } from "../features/chat/ChatWindow";
import { dashboardMetrics } from "../features/dashboard/dashboard-data";

export function App() {
  return (
    <AppShell>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Leads e vendas por dia" />
        <CampaignPerformanceTable />
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
        <ConversationList />
        <ChatWindow />
        <LeadDetailsPanel />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SaleForm />
        <AgentSettingsForm />
      </section>
    </AppShell>
  );
}

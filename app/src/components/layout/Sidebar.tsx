import { BarChart3, Bot, CalendarCheck, Home, MessageCircle, Settings, Target, Users, WalletCards } from "lucide-react";
import type { AppPage } from "../../types/domain";

const items = [
  { label: "Dashboard", page: "dashboard", icon: Home },
  { label: "Leads", page: "leads", icon: Users },
  { label: "Chat", page: "chat", icon: MessageCircle },
  { label: "Vendas", page: "sales", icon: WalletCards },
  { label: "Campanhas", page: "campaigns", icon: Target },
  { label: "Performance", page: "adsPerformance", icon: BarChart3 },
  { label: "Agente", page: "agent", icon: Bot },
  { label: "Relatorios", page: "reports", icon: CalendarCheck },
  { label: "Configuracoes", page: "settings", icon: Settings }
] satisfies Array<{
  label: string;
  page: AppPage;
  icon: typeof Home;
}>;

type SidebarProps = {
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
};

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-rosebrand-100 bg-white/90 px-4 py-5 shadow-soft backdrop-blur lg:block dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-8">
        <p className="text-sm font-semibold text-rosebrand-600">Fisiolipo</p>
        <h1 className="text-2xl font-bold tracking-tight">CRM Clinic</h1>
      </div>
      <nav className="space-y-1">
        {items.map(({ label, page, icon: Icon }) => {
          const selected = activePage === page;

          return (
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                selected
                  ? "bg-rosebrand-600 text-white shadow-soft"
                  : "text-zinc-700 hover:bg-rosebrand-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
              key={label}
              onClick={() => onPageChange(page)}
              type="button"
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

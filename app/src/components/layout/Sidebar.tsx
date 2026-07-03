import { BarChart3, Bot, CalendarCheck, Home, MessageCircle, Settings, Target, Users, WalletCards } from "lucide-react";

const items = [
  { label: "Dashboard", icon: Home },
  { label: "Leads", icon: Users },
  { label: "Chat", icon: MessageCircle },
  { label: "Vendas", icon: WalletCards },
  { label: "Campanhas", icon: Target },
  { label: "Performance", icon: BarChart3 },
  { label: "Agente", icon: Bot },
  { label: "Relatorios", icon: CalendarCheck },
  { label: "Configuracoes", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-rosebrand-100 bg-white/90 px-4 py-5 shadow-soft backdrop-blur lg:block dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-8">
        <p className="text-sm font-semibold text-rosebrand-600">Fisiolipo</p>
        <h1 className="text-2xl font-bold tracking-tight">CRM Clinic</h1>
      </div>
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon }, index) => (
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              index === 0
                ? "bg-rosebrand-600 text-white shadow-soft"
                : "text-zinc-700 hover:bg-rosebrand-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
            key={label}
            type="button"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

import { Bell, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

type TopbarProps = {
  onSignOut: () => void;
};

export function Topbar({ onSignOut }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-rosebrand-100 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-rosebrand-600">Operacao comercial</p>
          <h2 className="text-xl font-bold">Painel de atendimento e performance</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-rosebrand-100 bg-white p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" type="button" title="Buscar">
            <Search size={18} />
          </button>
          <button className="rounded-lg border border-rosebrand-100 bg-white p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" type="button" title="Notificacoes">
            <Bell size={18} />
          </button>
          <ThemeToggle />
          <button className="rounded-lg border border-rosebrand-100 bg-white p-2 text-zinc-700 transition hover:border-rosebrand-300 hover:text-rosebrand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" onClick={onSignOut} type="button" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

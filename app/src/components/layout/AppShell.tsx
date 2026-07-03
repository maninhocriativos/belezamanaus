import type { PropsWithChildren } from "react";
import type { AppPage } from "../../types/domain";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

type AppShellProps = PropsWithChildren<{
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
}>;

export function AppShell({ activePage, children, onPageChange }: AppShellProps) {
  const mainClass =
    activePage === "chat"
      ? "flex h-[calc(100vh-69px)] min-h-0 flex-col overflow-hidden p-0"
      : "mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8";

  return (
    <div className="min-h-screen bg-rosebrand-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar activePage={activePage} onPageChange={onPageChange} />
      <div className="min-h-screen lg:pl-72">
        <Topbar />
        <main className={mainClass}>{children}</main>
      </div>
    </div>
  );
}

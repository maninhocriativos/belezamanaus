import type { PropsWithChildren } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-rosebrand-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar />
      <div className="min-h-screen lg:pl-72">
        <Topbar />
        <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-rosebrand-50 px-4 text-zinc-950">
          <section className="w-full max-w-lg rounded-lg border border-rosebrand-100 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-rosebrand-600">Fisiolipo CRM</p>
            <h1 className="mt-2 text-2xl font-bold">Nao foi possivel carregar o app</h1>
            <p className="mt-3 text-sm text-zinc-600">
              Atualize a pagina. Se continuar, confira as variaveis do Supabase no Cloudflare Pages.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

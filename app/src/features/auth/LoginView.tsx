import { useState } from "react";
import { appEnv } from "../../lib/env";
import { isSupabaseConfigured, supabase, supabaseConfigStatus } from "../../lib/supabase";

type LoginViewProps = {
  onDemoAccess: () => void;
};

export function LoginView({ onDemoAccess }: LoginViewProps) {
  const [email, setEmail] = useState("maninhocriativos@gmail.com");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    if (!supabase) {
      setMessage("Supabase ainda nao esta configurado no ambiente do frontend.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: appEnv.appUrl
      }
    });

    setLoading(false);
    setMessage(error ? error.message : "Link de acesso enviado para o e-mail.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-rosebrand-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="w-full max-w-md rounded-lg border border-rosebrand-100 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-rosebrand-600">Fisiolipo</p>
        <h1 className="mt-1 text-2xl font-bold">Entrar no CRM</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Use o e-mail administrador da Beleza Manaus para receber um link seguro de acesso.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {supabaseConfigStatus === "invalid"
              ? "VITE_SUPABASE_URL esta invalida. Ela precisa comecar com https:// e usar o Project URL do Supabase."
              : "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Cloudflare Pages para ativar login real."}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium" htmlFor="email">
          E-mail
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />

        <button
          className="mt-4 w-full rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !email}
          onClick={sendMagicLink}
          type="button"
        >
          {loading ? "Enviando..." : "Enviar link de acesso"}
        </button>

        <button
          className="mt-3 w-full rounded-lg border border-rosebrand-100 px-4 py-2 text-sm font-semibold text-rosebrand-700 dark:border-zinc-800 dark:text-rosebrand-200"
          onClick={onDemoAccess}
          type="button"
        >
          Abrir modo demonstracao
        </button>

        {message && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
      </section>
    </main>
  );
}

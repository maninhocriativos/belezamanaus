import { useState } from "react";
import { appEnv } from "../../lib/env";
import { isSupabaseConfigured, supabase, supabaseConfigStatus } from "../../lib/supabase";
import { isEmailAddress, toLoginEmail } from "../../lib/username";

type LoginViewProps = {
  onDemoAccess: () => void;
};

export function LoginView({ onDemoAccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithPassword() {
    if (!supabase) {
      setMessage("Supabase ainda nao esta configurado no ambiente do frontend.");
      return;
    }

    const loginEmail = toLoginEmail(email);
    if (!loginEmail) {
      setMessage("Informe um nome de usuario ou e-mail.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    setLoading(false);
    setMessage(error ? error.message : "Acesso confirmado. Abrindo o CRM...");
  }

  async function createPasswordAccess() {
    if (!supabase) {
      setMessage("Supabase ainda nao esta configurado no ambiente do frontend.");
      return;
    }

    if (password.length < 6) {
      setMessage("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: "Maninho Criativos",
          organization_name: "Beleza Manaus"
        },
        emailRedirectTo: `${appEnv.appUrl}/`
      }
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      data.session
        ? "Acesso criado. Abrindo o cadastro inicial..."
        : "Acesso criado. Se o Supabase pedir confirmacao, confirme no e-mail antes de entrar com senha."
    );
  }

  async function sendMagicLink() {
    if (!supabase) {
      setMessage("Supabase ainda nao esta configurado no ambiente do frontend.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${appEnv.appUrl}/`
      }
    });

    setLoading(false);
    setMessage(
      error
        ? `${error.message}. Se o limite de e-mail continuar, use Entrar com senha ou Criar acesso com senha.`
        : "Link de acesso enviado para o e-mail."
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-rosebrand-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="w-full max-w-md rounded-lg border border-rosebrand-100 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-rosebrand-600">Fisiolipo</p>
        <h1 className="mt-1 text-2xl font-bold">Entrar no CRM</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Entre com seu nome de usuario (ou e-mail) e senha. Usuarios da equipe podem entrar so com o nome de usuario.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {supabaseConfigStatus === "invalid"
              ? "VITE_SUPABASE_URL esta invalida. Ela precisa comecar com https:// e usar o Project URL do Supabase."
              : "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Cloudflare Pages para ativar login real."}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium" htmlFor="email">
          Usuario ou e-mail
        </label>
        <input
          autoCapitalize="none"
          autoCorrect="off"
          className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome de usuario ou e-mail"
          type="text"
          value={email}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Senha
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite ou cadastre uma senha"
          type="password"
          value={password}
        />

        <button
          className="mt-4 w-full rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !email || !password}
          onClick={signInWithPassword}
          type="button"
        >
          {loading ? "Entrando..." : "Entrar com senha"}
        </button>

        <button
          className="mt-3 w-full rounded-lg border border-rosebrand-200 px-4 py-2 text-sm font-semibold text-rosebrand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-rosebrand-200"
          disabled={loading || !email || !password}
          onClick={createPasswordAccess}
          type="button"
        >
          Criar acesso com senha
        </button>

        <button
          className="mt-3 w-full rounded-lg border border-rosebrand-100 px-4 py-2 text-sm font-semibold text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300"
          disabled={loading || !isEmailAddress(email)}
          onClick={sendMagicLink}
          type="button"
        >
          Enviar link por e-mail
        </button>

        <button
          className="mt-3 w-full rounded-lg border border-rosebrand-100 px-4 py-2 text-sm font-semibold text-rosebrand-700 dark:border-zinc-800 dark:text-rosebrand-200"
          onClick={onDemoAccess}
          type="button"
        >
          Abrir modo demonstracao
        </button>

        {message && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-rosebrand-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          <a className="hover:text-rosebrand-700" href="/politica-de-privacidade">Privacidade</a>
          <a className="hover:text-rosebrand-700" href="/termos-de-servico">Termos</a>
          <a className="hover:text-rosebrand-700" href="/exclusao-de-dados">Exclusao de dados</a>
        </div>
      </section>
    </main>
  );
}

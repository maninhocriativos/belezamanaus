import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

type OnboardingViewProps = {
  onComplete: () => void;
  session: Session;
};

export function OnboardingView({ onComplete, session }: OnboardingViewProps) {
  const [fullName, setFullName] = useState(session.user.user_metadata.full_name ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    if (!supabase) return;
    if (password.length < 8) {
      setMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("As senhas nao conferem.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: {
        crm_profile_complete: true,
        full_name: fullName,
        phone
      }
    });

    if (authError) {
      setSaving(false);
      setMessage(authError.message);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: session.user.id,
      full_name: fullName,
      role: "owner"
    });

    setSaving(false);

    if (profileError) {
      setMessage("Senha salva. Perfil aguardando migrations do Supabase para gravar dados completos.");
      onComplete();
      return;
    }

    onComplete();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-rosebrand-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="w-full max-w-xl rounded-lg border border-rosebrand-100 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-rosebrand-600">Beleza Manaus</p>
        <h1 className="mt-1 text-2xl font-bold">Complete seu cadastro</h1>
        <p className="mt-2 text-sm text-zinc-500">Defina sua senha e dados iniciais para acessar o CRM.</p>

        <div className="mt-5 grid gap-3">
          <label className="text-sm font-medium">
            Nome completo
            <input className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800" onChange={(event) => setFullName(event.target.value)} value={fullName} />
          </label>
          <label className="text-sm font-medium">
            Telefone
            <input className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800" onChange={(event) => setPhone(event.target.value)} placeholder="(92) 99999-0000" value={phone} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Senha
              <input className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            </label>
            <label className="text-sm font-medium">
              Confirmar senha
              <input className="mt-2 w-full rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm outline-none focus:border-rosebrand-400 dark:border-zinc-800" onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
            </label>
          </div>
        </div>

        <button className="mt-5 w-full rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} onClick={saveProfile} type="button">
          {saving ? "Salvando..." : "Salvar e entrar"}
        </button>

        {message && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import type { CrmAgentProfile } from "../../services/crm-data";
import { saveAgentProfile } from "../../services/crm-data";

type AgentSettingsFormProps = {
  agent: CrmAgentProfile | null;
  onSaved: (agent: CrmAgentProfile) => void;
};

export function AgentSettingsForm({ agent, onSaved }: AgentSettingsFormProps) {
  const [initialMessage, setInitialMessage] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("Aline");
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState("");

  useEffect(() => {
    if (!agent) return;
    setInitialMessage(agent.initial_message ?? "");
    setName(agent.name);
    setTone(agent.tone ?? "");
  }, [agent]);

  async function submitAgent() {
    if (!name.trim()) {
      setMessage("Informe o nome da agente.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const saved = await saveAgentProfile({ id: agent?.id, initialMessage, name, tone });
      onSaved(saved);
      setMessage("Configuracao da agente salva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a agente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Configuracao da agente</h3>
      <div className="grid gap-3">
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setName(event.target.value)} placeholder="Nome da agente" value={name} />
        <textarea className="min-h-24 rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setTone(event.target.value)} placeholder="Tom de voz, regras e handoff" value={tone} />
        <textarea className="min-h-32 rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setInitialMessage(event.target.value)} placeholder="Mensagem inicial" value={initialMessage} />
        <button className="w-fit rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={submitAgent} type="button">
          {saving ? "Salvando..." : "Salvar agente"}
        </button>
        {message && <p className="text-sm text-zinc-500">{message}</p>}
      </div>
    </form>
  );
}

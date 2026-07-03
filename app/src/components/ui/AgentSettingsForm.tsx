export function AgentSettingsForm() {
  return (
    <form className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Configuracao da agente</h3>
      <div className="grid gap-3">
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Nome da agente" />
        <textarea className="min-h-24 rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Tom de voz, regras e handoff" />
        <button className="w-fit rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white" type="button">Salvar rascunho</button>
      </div>
    </form>
  );
}

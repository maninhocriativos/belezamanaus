export function SaleForm() {
  return (
    <form className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Registrar venda</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Procedimento" />
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Valor" />
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Pagamento" />
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" placeholder="Status" />
      </div>
    </form>
  );
}

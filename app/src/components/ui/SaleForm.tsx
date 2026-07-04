import { useState } from "react";
import type { CrmLead, CrmProcedure, CrmSale } from "../../services/crm-data";
import { createSale } from "../../services/crm-data";

type SaleFormProps = {
  leads: CrmLead[];
  onCreated: (sale: CrmSale) => void;
  procedures: CrmProcedure[];
};

function parseCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function SaleForm({ leads, onCreated, procedures }: SaleFormProps) {
  const [amount, setAmount] = useState("");
  const [leadId, setLeadId] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [procedureId, setProcedureId] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [saleStatus, setSaleStatus] = useState("completed");
  const [saving, setSaving] = useState(false);

  function handleProcedureChange(value: string) {
    setProcedureId(value);
    const procedure = procedures.find((item) => item.id === value);
    if (!procedure) return;
    setProcedureName(procedure.name);
    if (procedure.price !== null) setAmount(String(procedure.price).replace(".", ","));
  }

  async function submitSale() {
    const saleAmount = parseCurrency(amount);
    if (!procedureName.trim()) {
      setMessage("Informe o procedimento vendido.");
      return;
    }
    if (saleAmount <= 0) {
      setMessage("Informe um valor valido para a venda.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const sale = await createSale({
        amount: saleAmount,
        leadId,
        paymentMethod,
        paymentStatus,
        procedureId,
        procedureName,
        saleStatus
      });
      onCreated(sale);
      setAmount("");
      setLeadId("");
      setPaymentMethod("");
      setPaymentStatus("paid");
      setProcedureId("");
      setProcedureName("");
      setSaleStatus("completed");
      setMessage("Venda registrada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel registrar a venda.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Registrar venda</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => handleProcedureChange(event.target.value)} value={procedureId}>
          <option value="">Procedimento</option>
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>{procedure.name}</option>
          ))}
        </select>
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setProcedureName(event.target.value)} placeholder="Procedimento manual" value={procedureName} />
        <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setLeadId(event.target.value)} value={leadId}>
          <option value="">Lead sem vinculo</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>{lead.full_name}</option>
          ))}
        </select>
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="Valor" value={amount} />
        <input className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Pagamento" value={paymentMethod} />
        <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setPaymentStatus(event.target.value)} value={paymentStatus}>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="refunded">Estornado</option>
        </select>
        <select className="rounded-lg border border-rosebrand-100 bg-transparent px-3 py-2 text-sm dark:border-zinc-800" onChange={(event) => setSaleStatus(event.target.value)} value={saleStatus}>
          <option value="completed">Finalizada</option>
          <option value="draft">Rascunho</option>
          <option value="canceled">Cancelada</option>
        </select>
      </div>
      <button className="mt-4 rounded-lg bg-rosebrand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={submitSale} type="button">
        {saving ? "Registrando..." : "Registrar venda"}
      </button>
      {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}
    </form>
  );
}

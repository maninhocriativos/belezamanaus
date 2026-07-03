const rows = [
  ["Avaliacao Julho", "132", "R$ 18,40", "12", "3.2x"],
  ["Lead Forms Manaus", "89", "R$ 22,10", "7", "2.4x"],
  ["Remarketing", "41", "R$ 15,70", "9", "4.1x"]
];

export function CampaignPerformanceTable() {
  return (
    <article className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Performance de campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr><th>Campanha</th><th>Leads</th><th>CPL</th><th>Vendas</th><th>ROAS</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={row[0]}>
                {row.map((cell) => <td className="py-3 pr-3" key={cell}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

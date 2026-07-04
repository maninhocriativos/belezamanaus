export type CampaignPerformanceRow = {
  campaign: string;
  cpl: string;
  leads: number;
  roas: string;
  sales: number;
};

type CampaignPerformanceTableProps = {
  rows?: CampaignPerformanceRow[];
};

const emptyRows: CampaignPerformanceRow[] = [];

export function CampaignPerformanceTable({ rows = emptyRows }: CampaignPerformanceTableProps) {
  return (
    <article className="rounded-lg border border-rosebrand-100 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold">Performance de campanhas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr><th>Campanha</th><th>Leads</th><th>CPL</th><th>Vendas</th><th>ROAS</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="border-t border-rosebrand-50 dark:border-zinc-800">
                <td className="py-3 pr-3 text-zinc-500" colSpan={5}>Sem campanhas com dados para exibir.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr className="border-t border-rosebrand-50 dark:border-zinc-800" key={row.campaign}>
                <td className="py-3 pr-3">{row.campaign}</td>
                <td className="py-3 pr-3">{row.leads}</td>
                <td className="py-3 pr-3">{row.cpl}</td>
                <td className="py-3 pr-3">{row.sales}</td>
                <td className="py-3 pr-3">{row.roas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

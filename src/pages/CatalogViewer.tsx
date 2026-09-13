import { RefreshCw } from "lucide-react";
import { useAsync } from "../hooks/useAsync";
import { fetchCatalog } from "../mocks/catalogData";

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function CatalogViewer() {
  const { data: catalog, isLoading, error, retry } = useAsync(fetchCatalog, "catalog");

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">Notion Catalog</h1>
          <p className="mt-1 text-sm text-zinc-500">Source of truth for SKUs, pricing, and reorder rules.</p>
        </div>
        <button
          onClick={retry}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh from Notion
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-surface" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 p-4 text-sm text-zinc-300">
          Couldn't load the catalog.
          <button onClick={retry} className="ml-2 font-medium text-sky-400 hover:underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && catalog && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">SKU ID</th>
                <th className="px-3 py-2 font-medium">Product Name</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Safety Threshold</th>
                <th className="px-3 py-2 font-medium">Cost Price</th>
                <th className="px-3 py-2 font-medium">Retail Price</th>
                <th className="px-3 py-2 font-medium">Lead Time</th>
                <th className="px-3 py-2 font-medium">Reorder Unit</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((entry) => (
                <tr key={entry.sku_id} className="border-t border-border text-zinc-200">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">{entry.sku_id}</td>
                  <td className="px-3 py-2 font-medium">{entry.product_name}</td>
                  <td className="px-3 py-2 text-zinc-400">{entry.category}</td>
                  <td className="px-3 py-2 tabular-nums">{entry.safety_threshold}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(entry.cost_price)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(entry.retail_price)}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-400">{entry.lead_time_days}d</td>
                  <td className="px-3 py-2 text-zinc-400">{entry.reorder_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCatalog, type CatalogItem } from "../lib/api";

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function CatalogViewer() {
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    const { items } = await fetchCatalog();
    setCatalog(items);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetchCatalog().then(({ items }) => {
      if (!cancelled) {
        setCatalog(items);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-fg">Notion Catalog</h1>
          <p className="mt-1 text-sm text-fg-muted">Source of truth for SKUs, pricing, and reorder rules.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-hover"
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

      {!isLoading && catalog && catalog.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-fg-muted">
          No catalog items returned by Notion.
        </p>
      )}

      {!isLoading && catalog && catalog.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-fg-muted">
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
                <tr key={entry.sku_id} className="border-t border-border text-fg">
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{entry.sku_id}</td>
                  <td className="px-3 py-2 font-medium">{entry.product_name}</td>
                  <td className="px-3 py-2 text-fg-muted">{entry.category}</td>
                  <td className="px-3 py-2 tabular-nums">{entry.safety_threshold}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(entry.cost_price)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(entry.retail_price)}</td>
                  <td className="px-3 py-2 tabular-nums text-fg-muted">{entry.lead_time_days}d</td>
                  <td className="px-3 py-2 text-fg-muted">{entry.reorder_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

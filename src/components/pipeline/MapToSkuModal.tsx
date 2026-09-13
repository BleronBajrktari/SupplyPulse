import { X } from "lucide-react";
import { useState } from "react";
import type { CatalogEntry } from "../../mocks/catalogData";
import type { MatchedItem } from "../../types/pipeline";

interface MapToSkuModalProps {
  item: MatchedItem;
  catalog: CatalogEntry[];
  onCancel: () => void;
  onConfirm: (catalogSkuId: string) => void;
}

export function MapToSkuModal({ item, catalog, onCancel, onConfirm }: MapToSkuModalProps) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-sm border border-border bg-bg text-zinc-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Map to SKU</h2>
            <p className="text-xs text-zinc-500">{item.product_name} · qty {item.visual_quantity}</p>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto p-3">
          {catalog.map((entry) => (
            <button
              key={entry.sku_id}
              onClick={() => setSelectedSku(entry.sku_id)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selectedSku === entry.sku_id
                  ? "border-zinc-400 bg-surface-hover text-zinc-100"
                  : "border-border bg-surface text-zinc-300 hover:bg-surface-hover"
              }`}
            >
              <span>{entry.product_name}</span>
              <span className="font-mono text-xs text-zinc-500">{entry.sku_id}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-sm border border-border px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>
          <button
            disabled={!selectedSku}
            onClick={() => selectedSku && onConfirm(selectedSku)}
            className="rounded-sm bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            Confirm Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import type { ReorderPlan, SupplierGroup } from "../../types/restock";

interface Props {
  plan: ReorderPlan | null;
  onCancel: () => void;
  onConfirm: (planId: string) => void;
}

function groupBySupplier(plan: ReorderPlan): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const line of plan.lines) {
    const g = map.get(line.supplier) ?? { supplier: line.supplier, lines: [], units: 0 };
    g.lines.push(line);
    g.units += line.orderQty;
    map.set(line.supplier, g);
  }
  return [...map.values()];
}

export function DispatchPreviewModal({ plan, onCancel, onConfirm }: Props) {
  if (!plan) return null;

  const groups = groupBySupplier(plan);
  const totalSkus = plan.lines.length;
  const totalUnits = plan.lines.reduce((sum, l) => sum + l.orderQty, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-sm border border-[#27272A] bg-[#09090B] text-zinc-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#27272A] px-4 py-3">
          <h2 className="text-sm font-semibold">Dispatch Preview</h2>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-4 py-4">
          {groups.map((g) => (
            <div key={g.supplier}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {g.supplier}
              </div>
              <ul className="space-y-1">
                {g.lines.map((l) => (
                  <li key={l.sku} className="flex justify-between text-sm">
                    <span>{l.name}</span>
                    <span className="tabular-nums text-zinc-300">×{l.orderQty}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#27272A] px-4 py-3 text-xs text-zinc-400">
          {groups.length} supplier{groups.length > 1 ? "s" : ""} · {totalSkus} SKUs · {totalUnits} units
        </div>

        <div className="flex justify-end gap-2 border-t border-[#27272A] px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-sm border border-[#27272A] px-3 py-1.5 text-sm text-zinc-300 hover:border-[#52525B]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(plan.planId)}
            className="rounded-sm bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Confirm ✅
          </button>
        </div>
      </div>
    </div>
  );
}
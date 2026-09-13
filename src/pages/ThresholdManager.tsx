import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { ORCHESTRATOR } from "../agents";
import { fetchThresholds, saveThreshold, type ThresholdRow } from "../mocks/thresholdsData";

type SaveState = "idle" | "saving" | "saved";

export default function ThresholdManager() {
  const [rows, setRows] = useState<ThresholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});

  useEffect(() => {
    fetchThresholds()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const edit = (sku: string, field: "threshold" | "reorderQty", value: number) => {
    setRows((prev) => prev.map((r) => (r.sku === sku ? { ...r, [field]: value } : r)));
  };

  const commit = (row: ThresholdRow) => {
    setSaveState((s) => ({ ...s, [row.sku]: "saving" }));
    saveThreshold(row.sku, { threshold: row.threshold, reorderQty: row.reorderQty }).then(() => {
      setSaveState((s) => ({ ...s, [row.sku]: "saved" }));
      setTimeout(() => setSaveState((s) => ({ ...s, [row.sku]: "idle" })), 1200);
    });
  };

  const applyAiRecommendations = () => {
    const updated = rows.map((r) => ({ ...r, threshold: r.suggestedThreshold }));
    setRows(updated);
    for (const row of updated) {
      if (row.threshold !== rows.find((r) => r.sku === row.sku)?.threshold) {
        commit(row);
      }
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-sm bg-[#18181B]" />;
  }

  const hasChanges = rows.some((r) => r.threshold !== r.suggestedThreshold);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Suggestions come from {ORCHESTRATOR.name}'s demand analysis.</p>
        <button
          onClick={applyAiRecommendations}
          disabled={!hasChanges}
          className="flex items-center gap-1.5 rounded-sm bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          <Sparkles size={14} />
          Apply AI Recommendations
        </button>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#27272A]">
        <table className="w-full text-sm">
          <thead className="bg-[#0C0C0F] text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Threshold</th>
              <th className="px-3 py-2 font-medium">Reorder Qty</th>
              <th className="px-3 py-2 font-medium">AI Suggested</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sku} className="border-t border-[#27272A] text-zinc-200">
                <td className="px-3 py-2 font-mono text-xs text-zinc-400">{row.sku}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.threshold}
                    onChange={(e) => edit(row.sku, "threshold", Number(e.target.value))}
                    onBlur={() => commit(row)}
                    className="w-20 rounded-sm border border-[#27272A] bg-[#09090B] px-2 py-1 tabular-nums focus:border-[#52525B] focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.reorderQty}
                    onChange={(e) => edit(row.sku, "reorderQty", Number(e.target.value))}
                    onBlur={() => commit(row)}
                    className="w-20 rounded-sm border border-[#27272A] bg-[#09090B] px-2 py-1 tabular-nums focus:border-[#52525B] focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  {row.suggestedThreshold === row.threshold ? (
                    <span className="text-xs text-zinc-600">No change</span>
                  ) : (
                    <button
                      onClick={() => {
                        edit(row.sku, "threshold", row.suggestedThreshold);
                        commit({ ...row, threshold: row.suggestedThreshold });
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-sky-400 hover:underline"
                      title="Apply this suggestion"
                    >
                      <Sparkles size={12} />
                      {row.suggestedThreshold}
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {saveState[row.sku] === "saving" && (
                    <Loader2 size={14} className="inline animate-spin text-zinc-500" />
                  )}
                  {saveState[row.sku] === "saved" && (
                    <Check size={14} className="inline text-emerald-400" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

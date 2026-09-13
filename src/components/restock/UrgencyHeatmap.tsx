import type { ReorderPlan } from "../../types/restock";
import "./restock-animations.css";

interface Props {
  plans: ReorderPlan[];
  selectedId: string | null;
  onSelect: (planId: string) => void;
}

function urgencyColor(score: number): string {
  const l = 90 - score * 45;
  return `hsl(0 80% ${l}%)`;
}

function tileLabel(plan: ReorderPlan): string {
  return plan.lines[0]?.sku ?? plan.planId;
}

export function UrgencyHeatmap({ plans, selectedId, onSelect }: Props) {
  const sorted = [...plans].sort((a, b) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {sorted.map((plan) => {
        const urgent = plan.urgencyScore > 0.85;
        const selected = plan.planId === selectedId;
        const darkText = plan.urgencyScore > 0.55;
        return (
          <button
            key={plan.planId}
            onClick={() => onSelect(plan.planId)}
            style={{ backgroundColor: urgencyColor(plan.urgencyScore) }}
            className={[
              "flex aspect-square flex-col items-start justify-between rounded-sm border p-2 text-left transition",
              "border-[#27272A] hover:border-[#52525B]",
              selected ? "ring-2 ring-white/70" : "",
              urgent ? "sp-urgent" : "",
              darkText ? "text-white" : "text-zinc-900",
            ].join(" ")}
            title={`${tileLabel(plan)} · urgency ${(plan.urgencyScore * 100).toFixed(0)}%`}
          >
            <span className="text-xs font-semibold leading-tight">{tileLabel(plan)}</span>
            <span className="text-lg font-bold tabular-nums">
              {(plan.urgencyScore * 100).toFixed(0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
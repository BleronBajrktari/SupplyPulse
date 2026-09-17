import "./restock-animations.css";

export interface HeatmapTile {
  id: string;
  label: string;
  urgencyScore: number;
}

interface Props {
  tiles: HeatmapTile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function urgencyColor(score: number): string {
  const l = 90 - score * 45;
  return `hsl(0 80% ${l}%)`;
}

export function UrgencyHeatmap({ tiles, selectedId, onSelect }: Props) {
  const sorted = [...tiles].sort((a, b) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {sorted.map((tile) => {
        const urgent = tile.urgencyScore > 0.85;
        const selected = tile.id === selectedId;
        const darkText = tile.urgencyScore > 0.55;
        return (
          <button
            key={tile.id}
            onClick={() => onSelect(tile.id)}
            onMouseEnter={() => onSelect(tile.id)}
            style={{ backgroundColor: urgencyColor(tile.urgencyScore) }}
            className={[
              "flex aspect-square flex-col items-start justify-between rounded-sm border p-2 text-left transition",
              "border-border hover:border-zinc-400",
              selected ? "ring-2 ring-zinc-400" : "",
              urgent ? "sp-urgent" : "",
              darkText ? "text-white" : "text-zinc-900",
            ].join(" ")}
            title={`${tile.label} · urgency ${(tile.urgencyScore * 100).toFixed(0)}%`}
          >
            <span className="text-xs font-semibold leading-tight">{tile.label}</span>
            <span className="text-lg font-bold tabular-nums">
              {(tile.urgencyScore * 100).toFixed(0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

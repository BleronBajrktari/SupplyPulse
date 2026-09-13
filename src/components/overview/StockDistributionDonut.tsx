import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { InventoryStatus } from '../../types/inventory'

interface StockDistributionDonutProps {
  counts: Record<InventoryStatus, number>
}

const SLICES: { status: InventoryStatus; label: string; color: string }[] = [
  { status: 'ok', label: 'OK', color: 'var(--color-status-ok)' },
  { status: 'low', label: 'Low', color: 'var(--color-status-low)' },
  { status: 'critical', label: 'Critical', color: 'var(--color-status-critical)' },
]

export function StockDistributionDonut({ counts }: StockDistributionDonutProps) {
  const total = counts.ok + counts.low + counts.critical
  const data = SLICES.map((s) => ({ ...s, value: counts[s.status] }))

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={3} stroke="none">
              {data.map((d) => (
                <Cell key={d.status} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}
              labelStyle={{ color: '#e4e4e7' }}
              formatter={(value, _name, entry) => [`${value} SKUs`, (entry.payload as { label: string }).label]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-zinc-100">{total}</span>
          <span className="text-xs text-zinc-500">SKUs</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
            <span className="text-zinc-300">{d.label}</span>
            <span className="ml-auto font-mono tabular-nums text-zinc-500">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

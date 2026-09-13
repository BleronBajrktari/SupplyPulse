import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface DeficitProjectionChartProps {
  data: { day: string; deficit: number }[]
}

export function DeficitProjectionChart({ data }: DeficitProjectionChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}
            labelStyle={{ color: '#e4e4e7' }}
            formatter={(value) => [`${value} units`, 'Projected deficit']}
          />
          <Line
            type="monotone"
            dataKey="deficit"
            stroke="var(--color-status-processing)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-status-processing)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

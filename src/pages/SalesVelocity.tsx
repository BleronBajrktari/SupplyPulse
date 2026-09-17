import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatTile } from "../components/pipeline/StatTile";
import { useAsync } from "../hooks/useAsync";
import { fetchVelocity, SEASONALITY_INDEX } from "../mocks/velocityData";

export default function SalesVelocity() {
  const { data: velocity, isLoading, error, retry } = useAsync(fetchVelocity, "velocity");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-6 w-56 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (error || !velocity) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 p-4 text-sm text-fg">
          Couldn't load sales velocity data.
          <button onClick={retry} className="ml-2 font-medium text-sky-400 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalDaily = velocity.reduce((sum, v) => sum + v.daily_velocity, 0);
  const topMover = velocity[0];
  const chartData = [...velocity].sort((a, b) => b.daily_velocity - a.daily_velocity).slice(0, 10);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-fg">Sales Velocity</h1>
        <p className="mt-1 text-sm text-fg-muted">Daily sell-through from Google Sheets, top 10 SKUs.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Total Daily Units" value={totalDaily.toFixed(1)} />
        <StatTile label="Top Mover" value={topMover.product_name} />
        <StatTile label="Seasonality Index (this month)" value={`${SEASONALITY_INDEX}x`} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-fg">Top 10 SKUs by Daily Velocity</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="product_name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <Tooltip
                contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6 }}
                labelStyle={{ color: "#e4e4e7" }}
                formatter={(value) => [`${value} units/day`, "Velocity"]}
              />
              <Bar dataKey="daily_velocity" fill="var(--color-status-processing)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

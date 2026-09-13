import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";

type SyncState = "healthy" | "syncing" | "error";

interface SyncStatusPayload {
  provider: "google_sheets";
  state: SyncState;
  lastSyncAt: string;
  rowsWritten: number;
  lastError: string | null;
  sheetUrl: string;
}

function fetchSyncStatus(): Promise<SyncStatusPayload> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          provider: "google_sheets",
          state: "healthy",
          lastSyncAt: new Date().toISOString(),
          rowsWritten: 342,
          lastError: null,
          sheetUrl: "https://docs.google.com/spreadsheets/d/demo",
        }),
      300
    )
  );
}

type SseEventType = "scan.status" | "plan.created" | "inventory.updated" | "sync.status";

interface SyncEventLogRow {
  id: string;
  event: SseEventType;
  summary: string;
  payload: string;
  latencyMs: number;
  timestamp: string;
}

function fetchSyncEventLog(): Promise<SyncEventLogRow[]> {
  const now = Date.now();
  const rows: SyncEventLogRow[] = [
    { id: "evt_1", event: "scan.status", summary: "scan_8f2a → complete", payload: '{"scanId":"scan_8f2a","stage":"complete"}', latencyMs: 112, timestamp: new Date(now - 2 * 60000).toISOString() },
    { id: "evt_2", event: "plan.created", summary: "plan_8f01 · urgency 92%", payload: '{"planId":"plan_8f01","urgencyScore":0.92}', latencyMs: 98, timestamp: new Date(now - 5 * 60000).toISOString() },
    { id: "evt_3", event: "inventory.updated", summary: "2 SKUs updated", payload: '{"skus":["OATML-1L","COLA-330"]}', latencyMs: 143, timestamp: new Date(now - 6 * 60000).toISOString() },
    { id: "evt_4", event: "sync.status", summary: "state → syncing", payload: '{"state":"syncing"}', latencyMs: 76, timestamp: new Date(now - 6.5 * 60000).toISOString() },
    { id: "evt_5", event: "sync.status", summary: "state → healthy", payload: '{"state":"healthy","rowsWritten":342}', latencyMs: 289, timestamp: new Date(now - 6.8 * 60000).toISOString() },
    { id: "evt_6", event: "scan.status", summary: "scan_3b11 → matching_catalog", payload: '{"scanId":"scan_3b11","stage":"matching_catalog"}', latencyMs: 121, timestamp: new Date(now - 22 * 60000).toISOString() },
    { id: "evt_7", event: "plan.created", summary: "plan_8f02 · urgency 74%", payload: '{"planId":"plan_8f02","urgencyScore":0.74}', latencyMs: 431, timestamp: new Date(now - 26 * 60000).toISOString() },
    { id: "evt_8", event: "inventory.updated", summary: "1 SKU updated", payload: '{"skus":["COCA-COLA-500ML"]}', latencyMs: 104, timestamp: new Date(now - 27 * 60000).toISOString() },
  ];
  return new Promise((resolve) => setTimeout(() => resolve(rows), 300));
}

const eventBadge: Record<SseEventType, string> = {
  "scan.status": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "plan.created": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "inventory.updated": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "sync.status": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

function latencyColor(ms: number): string {
  if (ms < 150) return "text-emerald-400";
  if (ms < 400) return "text-amber-400";
  return "text-red-400";
}

const stateMeta: Record<SyncState, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  healthy: { label: "Healthy", cls: "text-emerald-400", Icon: CheckCircle2 },
  syncing: { label: "Syncing…", cls: "text-sky-400", Icon: RefreshCw },
  error: { label: "Error", cls: "text-red-400", Icon: AlertTriangle },
};

export default function SyncStatus() {
  const [data, setData] = useState<SyncStatusPayload | null>(null);
  const [events, setEvents] = useState<SyncEventLogRow[] | null>(null);

  useEffect(() => {
    fetchSyncStatus().then(setData);
    fetchSyncEventLog().then(setEvents);
  }, []);

  if (!data) return <div className="h-32 animate-pulse rounded-sm bg-[#18181B]" />;

  const { label, cls, Icon } = stateMeta[data.state];

  const syncNow = () => {
    setData((d) => (d ? { ...d, state: "syncing" } : d));
    setTimeout(
      () =>
        setData((d) =>
          d
            ? {
                ...d,
                state: "healthy",
                lastSyncAt: new Date().toISOString(),
                rowsWritten: d.rowsWritten + 1,
              }
            : d
        ),
      1200
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="h-fit rounded-sm border border-[#27272A] bg-[#0C0C0F] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={18} className={`${cls} ${data.state === "syncing" ? "animate-spin" : ""}`} />
            <span className={`text-sm font-semibold ${cls}`}>{label}</span>
          </div>
          <span className="text-xs text-zinc-500">Google Sheets</span>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Last sync</dt>
            <dd className="text-zinc-200">{new Date(data.lastSyncAt).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Rows written</dt>
            <dd className="tabular-nums text-zinc-200">{data.rowsWritten}</dd>
          </div>
          {data.lastError && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Last error</dt>
              <dd className="text-red-400">{data.lastError}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={syncNow}
            disabled={data.state === "syncing"}
            className="rounded-sm border border-[#27272A] px-3 py-1.5 text-sm text-zinc-200 hover:border-[#52525B] disabled:opacity-50"
          >
            Sync now
          </button>
          <a
            href={data.sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline"
          >
            Open sheet <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="rounded-sm border border-[#27272A]">
        <div className="border-b border-[#27272A] bg-[#0C0C0F] px-3 py-2">
          <h2 className="text-sm font-semibold text-zinc-300">Sync Event Log</h2>
          <p className="text-xs text-zinc-500">Recent SSE events on /api/v1/events</p>
        </div>

        {!events ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-sm bg-[#18181B]" />
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0C0C0F] text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Payload</th>
                  <th className="px-3 py-2 font-medium text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="border-t border-[#27272A] text-zinc-200">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-sm border px-2 py-0.5 text-xs ${eventBadge[evt.event]}`}>
                        {evt.event}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-zinc-300">{evt.summary}</div>
                      <code className="text-xs text-zinc-600">{evt.payload}</code>
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums ${latencyColor(evt.latencyMs)}`}>
                      {evt.latencyMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { CheckCircle2, ExternalLink, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchIntegrationHealth,
  testAllConnections,
  GOOGLE_SHEET_URL,
  type ConnectionState,
  type IntegrationHealth,
} from "../mocks/healthData";

const STATE_META: Record<ConnectionState, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  connected: { label: "Connected", className: "text-status-ok", Icon: CheckCircle2 },
  degraded: { label: "Degraded", className: "text-status-low", Icon: Loader2 },
  error: { label: "Error", className: "text-status-critical", Icon: XCircle },
};

export default function HealthBoard() {
  const [health, setHealth] = useState<IntegrationHealth[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchIntegrationHealth().then((h) => {
      setHealth(h);
      setLoading(false);
    });
  }, []);

  function handleTestAll() {
    setTesting(true);
    testAllConnections().then((h) => {
      setHealth(h);
      setTesting(false);
    });
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">Integration Health</h1>
          <p className="mt-1 text-sm text-zinc-500">Live connection state across the pipeline's five integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-surface-hover"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Google Sheet
          </a>
          <button
            onClick={handleTestAll}
            disabled={testing || loading}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
            Test All Connections
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading || !health
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-surface" />)
          : health.map((entry) => {
              const meta = STATE_META[entry.state];
              const StateIcon = meta.Icon;
              return (
                <div key={entry.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-100">{entry.name}</span>
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    ) : (
                      <StateIcon className={`h-4 w-4 ${meta.className}`} />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{entry.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className={`text-xs font-medium ${meta.className}`}>{meta.label}</span>
                    <span className="font-mono text-xs tabular-nums text-zinc-400">
                      {testing ? "…" : `${entry.latencyMs}ms`}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

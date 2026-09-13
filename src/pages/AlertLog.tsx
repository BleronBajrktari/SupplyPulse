import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Send, XCircle } from "lucide-react";
import { Fragment, useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { fetchAlertLog, resendAlert } from "../mocks/historyData";

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AlertLog() {
  const { data: log, isLoading, error, retry } = useAsync(fetchAlertLog, "alert-log");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resentIds, setResentIds] = useState<Set<string>>(new Set());

  function handleResend(id: string) {
    setResendingId(id);
    resendAlert(id).then(() => {
      setResendingId(null);
      setResentIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setResentIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 2500);
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-6">
        <div className="mb-2 h-6 w-48 animate-pulse rounded bg-surface" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-surface" />
        ))}
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 p-4 text-sm text-zinc-300">
          Couldn't load the alert log.
          <button onClick={retry} className="ml-2 font-medium text-sky-400 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-100">Restock Alert Log</h1>
        <p className="mt-1 text-sm text-zinc-500">History of past scans and the reorders they triggered.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Timestamp</th>
              <th className="px-3 py-2 font-medium">Shop</th>
              <th className="px-3 py-2 font-medium">SKUs Detected</th>
              <th className="px-3 py-2 font-medium">Items to Reorder</th>
              <th className="px-3 py-2 font-medium">Total Cost</th>
              <th className="px-3 py-2 font-medium">Slack Sent</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {log.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const justResent = resentIds.has(entry.id);
              return (
                <Fragment key={entry.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="cursor-pointer border-t border-border text-zinc-200 hover:bg-surface-hover"
                  >
                    <td className="px-3 py-2 text-zinc-500">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{formatTimestamp(entry.timestamp)}</td>
                    <td className="px-3 py-2 font-medium">{entry.shop}</td>
                    <td className="px-3 py-2 tabular-nums">{entry.skus_detected}</td>
                    <td className="px-3 py-2 tabular-nums">{entry.items_to_reorder}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCurrency(entry.total_cost)}</td>
                    <td className="px-3 py-2">
                      {entry.slack_sent || justResent ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-status-ok">
                          <CheckCircle2 size={13} /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-status-critical">
                          <XCircle size={13} /> Not sent
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResend(entry.id);
                        }}
                        disabled={resendingId === entry.id}
                        className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs font-medium text-sky-400 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendingId === entry.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Resend Alert
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-t border-border bg-bg">
                      <td colSpan={8} className="px-4 py-3">
                        <ul className="space-y-1">
                          {entry.items.map((item) => (
                            <li key={item.sku_id} className="flex justify-between text-sm text-zinc-300">
                              <span>{item.product_name}</span>
                              <span className="tabular-nums text-zinc-400">
                                {item.on_shelf_qty} on shelf → +{item.suggested_qty} ({formatCurrency(item.estimated_cost)})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

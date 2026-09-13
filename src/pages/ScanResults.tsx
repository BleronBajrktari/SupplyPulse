import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, ChevronRight, HelpCircle, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapToSkuModal } from "../components/pipeline/MapToSkuModal";
import { StatTile } from "../components/pipeline/StatTile";
import { UrgencyBadge } from "../components/pipeline/UrgencyBadge";
import { URGENCY_DOT_STYLE, URGENCY_PLAIN_LABEL } from "../components/pipeline/urgency";
import { useAsync } from "../hooks/useAsync";
import { fetchCatalog } from "../mocks/catalogData";
import { fetchPipelinePayload } from "../mocks/pipelineData";
import { fetchVelocity } from "../mocks/velocityData";
import type { MatchedItem, ReorderPlanItem, UrgencyLabel } from "../types/pipeline";

type SortKey = "product_name" | "on_shelf_qty" | "suggested_qty" | "estimated_cost" | "lead_time_days" | "urgency_score";

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

const URGENCY_LEGEND: UrgencyLabel[] = ["URGENT", "HIGH", "MEDIUM"];

interface SortHeaderProps {
  label: string;
  sortKeyValue: SortKey;
  activeKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKeyValue, activeKey, sortDir, onSort }: SortHeaderProps) {
  const active = activeKey === sortKeyValue;
  return (
    <button
      onClick={() => onSort(sortKeyValue)}
      className={`flex items-center gap-1 font-medium ${active ? "text-zinc-200" : "text-zinc-500"}`}
    >
      {label}
      {active && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  );
}

export default function ScanResults() {
  const navigate = useNavigate();
  const { data: payload, isLoading, error, retry } = useAsync(fetchPipelinePayload, "pipeline-payload");
  const { data: catalog } = useAsync(fetchCatalog, "catalog-for-mapping");
  const { data: velocity } = useAsync(fetchVelocity, "velocity-for-reasoning");

  const [sortKey, setSortKey] = useState<SortKey>("urgency_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showManualReview, setShowManualReview] = useState(false);
  const [mappingItem, setMappingItem] = useState<MatchedItem | null>(null);
  const [mappedIds, setMappedIds] = useState<Set<string>>(new Set());
  const [approveState, setApproveState] = useState<"idle" | "posting" | "done">("idle");
  const [approvedSkus, setApprovedSkus] = useState<Set<string>>(new Set());
  const [reasoningItem, setReasoningItem] = useState<ReorderPlanItem | null>(null);

  function buildReasoning(item: ReorderPlanItem): string {
    const threshold = catalog?.find((c) => c.sku_id === item.sku_id)?.safety_threshold;
    const dailyVelocity = velocity?.find((v) => v.sku_id === item.sku_id)?.daily_velocity;
    const daysOfCover = dailyVelocity ? item.on_shelf_qty / dailyVelocity : null;
    const coverText =
      daysOfCover == null
        ? "very little stock left"
        : daysOfCover < 1
          ? "less than a day of stock left"
          : `about ${Math.round(daysOfCover)} day${Math.round(daysOfCover) === 1 ? "" : "s"} of stock left`;
    const thresholdText = threshold != null ? ` against a safe minimum of ${threshold}` : "";

    return `${item.product_name} has ${item.on_shelf_qty} left on the shelf${thresholdText} — ${coverText} at the current sell-through rate. The supplier takes ${item.lead_time_days} day${item.lead_time_days === 1 ? "" : "s"} to deliver, so we recommend ordering ${item.suggested_qty} units now to avoid running out.`;
  }

  const sortedItems = useMemo<ReorderPlanItem[]>(() => {
    if (!payload) return [];
    const items = [...payload.reorder_plan.items];
    items.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [payload, sortKey, sortDir]);

  const manualReviewItems = useMemo(
    () => (payload ? payload.matched_items.filter((i) => i.requires_manual_mapping && !mappedIds.has(i.sku_id)) : []),
    [payload, mappedIds],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 p-4 text-sm text-zinc-300">
          Couldn't load scan results.
          <button onClick={retry} className="ml-2 font-medium text-sky-400 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary } = payload;

  return (
    <div className="flex flex-col gap-4 p-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-zinc-100">Scan Results</h1>
          <p className="mt-1 text-sm text-zinc-500">Latest shelf scan, matched against Notion and live sales data.</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-hover"
        >
          Run a scan
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label="SKUs Detected" value={String(summary.skus_detected)} />
        <StatTile label="SKUs Matched" value={String(summary.skus_matched)} />
        <StatTile label="Manual Review" value={String(summary.skus_manual_review)} />
        <StatTile label="Items to Reorder" value={String(summary.items_to_reorder)} />
        <StatTile label="Est. Cost" value={formatCurrency(summary.total_estimated_cost)} />
        <StatTile label="Duration" value={`${summary.pipeline_duration_seconds.toFixed(1)}s`} />
        <StatTile label="Confidence" value={`${Math.round(summary.scan_confidence * 100)}%`} />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">What the colors mean:</span>
        {URGENCY_LEGEND.map((label) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${URGENCY_DOT_STYLE[label]}`} aria-hidden />
            {URGENCY_PLAIN_LABEL[label]}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2">
                <SortHeader label="Product Name" sortKeyValue="product_name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="On Shelf" sortKeyValue="on_shelf_qty" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Order Qty" sortKeyValue="suggested_qty" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Est. Cost" sortKeyValue="estimated_cost" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Lead Days" sortKeyValue="lead_time_days" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Urgency" sortKeyValue="urgency_score" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2 font-medium text-zinc-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
              const isApproved = approvedSkus.has(item.sku_id) || approveState === "done";
              return (
                <tr key={item.sku_id} className="border-t border-border text-zinc-200">
                  <td className="px-3 py-2 font-medium">{item.product_name}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-400">{item.on_shelf_qty}</td>
                  <td className="px-3 py-2 tabular-nums">{item.suggested_qty}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(item.estimated_cost)}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-400">{item.lead_time_days}d</td>
                  <td className="px-3 py-2">
                    <UrgencyBadge label={item.urgency_label} score={item.urgency_score} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setApprovedSkus((prev) => new Set(prev).add(item.sku_id))}
                        disabled={isApproved}
                        className="rounded-sm bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-default disabled:bg-zinc-700 disabled:text-zinc-400"
                      >
                        {isApproved ? "Approved" : "Approve"}
                      </button>
                      <button
                        onClick={() => setReasoningItem(item)}
                        className="flex items-center gap-1 text-xs font-medium text-sky-400 hover:underline"
                      >
                        <HelpCircle size={12} />
                        Why this order?
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reasoningItem && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Why this order? · {reasoningItem.product_name}</h2>
            <button
              onClick={() => setReasoningItem(null)}
              className="rounded-md p-1 text-zinc-400 hover:bg-surface-hover hover:text-zinc-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{buildReasoning(reasoningItem)}</p>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <button
          onClick={() => setShowManualReview((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-zinc-100">
            Manual Review <span className="text-zinc-500">({manualReviewItems.length} items)</span>
          </span>
          {showManualReview ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
        </button>

        {showManualReview && (
          <div className="border-t border-border">
            {manualReviewItems.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">All detected items have been mapped.</p>
            ) : (
              <ul>
                {manualReviewItems.map((item) => (
                  <li key={item.sku_id} className="flex items-center justify-between border-t border-border px-4 py-2.5 first:border-t-0">
                    <div>
                      <p className="text-sm text-zinc-200">{item.product_name}</p>
                      <p className="text-xs text-zinc-500">
                        detected qty {item.visual_quantity} · {item.sku_id}
                      </p>
                    </div>
                    <button
                      onClick={() => setMappingItem(item)}
                      className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-sky-400 hover:border-zinc-500"
                    >
                      Map to SKU
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div>
            <p className="text-xs text-zinc-500">Total restock cost</p>
            <p className="font-mono text-lg font-semibold text-zinc-100">{formatCurrency(summary.total_estimated_cost)}</p>
          </div>

          {approveState === "done" ? (
            <span className="flex items-center gap-2 rounded-md border border-status-ok/30 bg-status-ok/10 px-4 py-2 text-sm text-status-ok">
              <CheckCircle2 className="h-4 w-4" />
              Posted to Slack · Appended to Google Sheets
            </span>
          ) : (
            <button
              onClick={() => {
                setApproveState("posting");
                setTimeout(() => setApproveState("done"), 900);
              }}
              disabled={approveState === "posting"}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {approveState === "posting" && <Loader2 className="h-4 w-4 animate-spin" />}
              Approve All Orders
            </button>
          )}
        </div>
      </div>

      {mappingItem && catalog && (
        <MapToSkuModal
          item={mappingItem}
          catalog={catalog}
          onCancel={() => setMappingItem(null)}
          onConfirm={() => {
            setMappedIds((prev) => new Set(prev).add(mappingItem.sku_id));
            setMappingItem(null);
          }}
        />
      )}
    </div>
  );
}

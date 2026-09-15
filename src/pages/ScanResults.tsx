import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, ChevronRight, ExternalLink, HelpCircle, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BoundingBoxViewer } from "../components/scans/BoundingBoxViewer";
import { UrgencyHeatmap, type HeatmapTile } from "../components/restock/UrgencyHeatmap";
import { MapToSkuModal } from "../components/pipeline/MapToSkuModal";
import { StatTile } from "../components/pipeline/StatTile";
import { UrgencyBadge } from "../components/pipeline/UrgencyBadge";
import { URGENCY_DOT_STYLE, URGENCY_PLAIN_LABEL } from "../components/pipeline/urgency";
import { useAsync } from "../hooks/useAsync";
import { fetchScan } from "../api/scans";
import { fetchCatalog } from "../mocks/catalogData";
import { fetchPipelinePayload } from "../mocks/pipelineData";
import { fetchVelocity } from "../mocks/velocityData";
import type { MatchedItem, UrgencyLabel } from "../types/pipeline";
import type { ReorderItem, ScanResult } from "../lib/api";

const FEATURED_SCAN_ID = "scan_8f2a";

/** Unified row shape the table/heatmap/hover-sync work off, regardless of whether the
 * data came from the real backend (`ScanResult`, keyed by name — no stable id exists yet)
 * or the mock payload (`PipelinePayload`, keyed by sku_id). */
interface ReorderRow {
  id: string;
  name: string;
  onShelf: number;
  orderQty: number;
  cost: number;
  leadDays: number;
  urgency: number;
  label: string;
}

type SortKey = "name" | "onShelf" | "orderQty" | "urgency";

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function mapRealItems(items: ReorderItem[]): ReorderRow[] {
  return items
    .filter((item) => item.suggested_qty > 0)
    .map((item, i) => ({
      id: item.product_name || item.vision_description || `row-${i}`,
      name: item.product_name || item.vision_description || "Unidentified item",
      onShelf: item.effective_quantity,
      orderQty: item.suggested_qty,
      cost: item.estimated_cost,
      leadDays: item.lead_time_days,
      urgency: item.urgency_score,
      label: item.urgency_label,
    }));
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
      className={`flex items-center gap-1 font-medium ${active ? "text-fg" : "text-fg-muted"}`}
    >
      {label}
      {active && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  );
}

export default function ScanResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const realResult = (location.state as { result?: ScanResult } | null)?.result;

  // Mock fallback: only fetched/used when a direct page load has no router-state result
  // (e.g. a refresh) so the page still functions.
  const mockPayload = useAsync(fetchPipelinePayload, "pipeline-payload");
  const { data: catalog } = useAsync(fetchCatalog, "catalog-for-mapping");
  const { data: velocity } = useAsync(fetchVelocity, "velocity-for-reasoning");
  const { data: scan } = useAsync(() => fetchScan(FEATURED_SCAN_ID), FEATURED_SCAN_ID);

  const [sortKey, setSortKey] = useState<SortKey>("urgency");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showManualReview, setShowManualReview] = useState(false);
  const [mappingItem, setMappingItem] = useState<MatchedItem | null>(null);
  const [mappedIds, setMappedIds] = useState<Set<string>>(new Set());
  const [approveState, setApproveState] = useState<"idle" | "posting" | "done">("idle");
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [reasoningItem, setReasoningItem] = useState<ReorderRow | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedApproveState, setSelectedApproveState] = useState<"idle" | "posting" | "done">("idle");

  const usingRealData = Boolean(realResult);
  const isLoading = !usingRealData && mockPayload.isLoading;
  const error = !usingRealData && mockPayload.error;

  const summary = usingRealData
    ? realResult!.summary
    : mockPayload.data?.summary;

  const sheetUrl = usingRealData ? realResult!.sheet_url : undefined;

  const manualReviewSourceItems = usingRealData
    ? (realResult!.matched_items ?? []).filter((i) => i.requires_manual_mapping)
    : (mockPayload.data?.matched_items ?? []).filter((i) => i.requires_manual_mapping && !mappedIds.has(i.sku_id));

  function buildReasoning(item: ReorderRow): string {
    const threshold = catalog?.find((c) => c.sku_id === item.id || c.product_name === item.name)?.safety_threshold;
    const dailyVelocity = velocity?.find((v) => v.sku_id === item.id || v.product_name === item.name)?.daily_velocity;
    const daysOfCover = dailyVelocity ? item.onShelf / dailyVelocity : null;
    const coverText =
      daysOfCover == null
        ? "very little stock left"
        : daysOfCover < 1
          ? "less than a day of stock left"
          : `about ${Math.round(daysOfCover)} day${Math.round(daysOfCover) === 1 ? "" : "s"} of stock left`;
    const thresholdText = threshold != null ? ` against a safe minimum of ${threshold}` : "";

    return `${item.name} has ${item.onShelf} left on the shelf${thresholdText} — ${coverText} at the current sell-through rate. The supplier takes ${item.leadDays} day${item.leadDays === 1 ? "" : "s"} to deliver, so we recommend ordering ${item.orderQty} units now to avoid running out.`;
  }

  const rows = useMemo<ReorderRow[]>(() => {
    if (usingRealData) return mapRealItems(realResult!.reorder_plan.items);
    if (!mockPayload.data) return [];
    return mockPayload.data.reorder_plan.items.map((item) => ({
      id: item.sku_id,
      name: item.product_name,
      onShelf: item.on_shelf_qty,
      orderQty: item.suggested_qty,
      cost: item.estimated_cost,
      leadDays: item.lead_time_days,
      urgency: item.urgency_score,
      label: item.urgency_label,
    }));
  }, [usingRealData, realResult, mockPayload.data]);

  const sortedRows = useMemo<ReorderRow[]>(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const heatmapTiles = useMemo<HeatmapTile[]>(
    () => sortedRows.map((row) => ({ id: row.id, label: row.name, urgencyScore: row.urgency })),
    [sortedRows],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === sortedRows.length ? new Set() : new Set(sortedRows.map((r) => r.id))));
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

  if (error || !summary) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-status-critical/30 bg-status-critical/5 p-4 text-sm text-fg">
          Couldn't load scan results.
          <button onClick={mockPayload.retry} className="ml-2 font-medium text-sky-400 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const allSelected = selectedIds.size > 0 && selectedIds.size === sortedRows.length;

  return (
    <div className="flex flex-col gap-4 p-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-semibold text-fg">Scan Results</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {usingRealData ? "Live pipeline run" : "Latest shelf scan (mock)"}, matched against Notion and live sales data.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-surface-hover"
            >
              Open Sheet
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-hover"
          >
            Run a scan
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label="SKUs Detected" value={String(summary.skus_detected)} />
        <StatTile label="SKUs Matched" value={String(summary.skus_matched)} />
        <StatTile label="Manual Review" value={String(summary.skus_manual_review)} />
        <StatTile label="Items to Reorder" value={String(summary.items_to_reorder)} />
        <StatTile label="Est. Cost" value={formatCurrency(summary.total_estimated_cost)} />
        <StatTile label="Duration" value={`${summary.pipeline_duration_seconds.toFixed(1)}s`} />
        <StatTile label="Confidence" value={summary.scan_confidence != null ? `${Math.round(summary.scan_confidence * 100)}%` : "—"} />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-semibold text-fg">Urgency Heatmap</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
            {URGENCY_LEGEND.map((label) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${URGENCY_DOT_STYLE[label]}`} aria-hidden />
                {URGENCY_PLAIN_LABEL[label]}
              </span>
            ))}
          </div>
        </div>
        <UrgencyHeatmap tiles={heatmapTiles} selectedId={hoveredId} onSelect={setHoveredId} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-6">
          <h2 className="mb-2 text-sm font-semibold text-fg">Shelf Photo · {FEATURED_SCAN_ID}</h2>
          {usingRealData && (
            <p className="mb-2 text-xs text-fg-muted">
              (The live pipeline doesn't return shelf imagery yet — showing the reference scan.)
            </p>
          )}
          {scan ? (
            <BoundingBoxViewer
              imageUrl={scan.imageUrl}
              imageWidth={scan.imageWidth}
              imageHeight={scan.imageHeight}
              detections={scan.detections}
              hoveredSku={hoveredId}
              onHoverSku={setHoveredId}
            />
          ) : (
            <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-surface" />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="w-8 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all rows"
                      className="h-3.5 w-3.5 accent-emerald-600"
                    />
                  </th>
                  <th className="px-3 py-2">
                    <SortHeader label="Product" sortKeyValue="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-3 py-2">
                    <SortHeader label="On Shelf" sortKeyValue="onShelf" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-3 py-2">
                    <SortHeader label="Order" sortKeyValue="orderQty" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-3 py-2">
                    <SortHeader label="Urgency" sortKeyValue="urgency" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-3 py-2 font-medium text-fg-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const isApproved = approvedIds.has(row.id) || approveState === "done";
                  const isHovered = hoveredId === row.id;
                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredId(row.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`border-t border-border text-fg transition-colors ${isHovered ? "bg-surface-hover" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          aria-label={`Select ${row.name}`}
                          className="h-3.5 w-3.5 accent-emerald-600"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {row.name}
                        <div className="font-mono text-xs font-normal text-fg-muted">{formatCurrency(row.cost)} · {row.leadDays}d lead</div>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-fg-muted">{row.onShelf}</td>
                      <td className="px-3 py-2 tabular-nums">{row.orderQty}</td>
                      <td className="px-3 py-2">
                        <UrgencyBadge label={row.label} score={row.urgency} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            onClick={() => setApprovedIds((prev) => new Set(prev).add(row.id))}
                            disabled={isApproved}
                            className="rounded-sm bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-default disabled:bg-zinc-700 disabled:text-fg-muted"
                          >
                            {isApproved ? "Approved" : "Approve"}
                          </button>
                          <button
                            onClick={() => setReasoningItem(row)}
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
                <h2 className="text-sm font-semibold text-fg">Why this order? · {reasoningItem.name}</h2>
                <button
                  onClick={() => setReasoningItem(null)}
                  className="rounded-md p-1 text-fg-muted hover:bg-surface-hover hover:text-fg"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-fg">{buildReasoning(reasoningItem)}</p>
            </div>
          )}

          <div className="rounded-lg border border-border">
            <button
              onClick={() => setShowManualReview((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-fg">
                Manual Review <span className="text-fg-muted">({manualReviewSourceItems.length} items)</span>
              </span>
              {showManualReview ? <ChevronDown size={16} className="text-fg-muted" /> : <ChevronRight size={16} className="text-fg-muted" />}
            </button>

            {showManualReview && (
              <div className="border-t border-border">
                {manualReviewSourceItems.length === 0 ? (
                  <p className="p-4 text-sm text-fg-muted">All detected items have been mapped.</p>
                ) : (
                  <ul>
                    {manualReviewSourceItems.map((item) => (
                      <li key={item.sku_id} className="flex items-center justify-between border-t border-border px-4 py-2.5 first:border-t-0">
                        <div>
                          <p className="text-sm text-fg">{item.product_name}</p>
                          <p className="text-xs text-fg-muted">
                            detected qty {item.visual_quantity} · {item.sku_id}
                          </p>
                        </div>
                        {!usingRealData && (
                          <button
                            onClick={() => setMappingItem(item)}
                            className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-sky-400 hover:border-zinc-500"
                          >
                            Map to SKU
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div>
            <p className="text-xs text-fg-muted">Total restock cost</p>
            <p className="font-mono text-lg font-semibold text-fg">{formatCurrency(summary.total_estimated_cost)}</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedApproveState === "done" ? (
              <span className="flex items-center gap-2 rounded-md border border-status-ok/30 bg-status-ok/10 px-3 py-2 text-xs text-status-ok">
                <CheckCircle2 className="h-4 w-4" />
                Selected rows posted to Slack + Sheets
              </span>
            ) : (
              <button
                onClick={() => {
                  setSelectedApproveState("posting");
                  setTimeout(() => {
                    setApprovedIds((prev) => new Set([...prev, ...selectedIds]));
                    setSelectedApproveState("done");
                  }, 700);
                }}
                disabled={selectedIds.size === 0 || selectedApproveState === "posting"}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedApproveState === "posting" && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve Selected ({selectedIds.size})
              </button>
            )}

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

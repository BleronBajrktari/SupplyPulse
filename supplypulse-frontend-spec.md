# SupplyPulse — Frontend Technical Specification

**Version:** 1.0  ·  **Status:** Ready to build  ·  **Audience:** Frontend engineer(s)
**Surfaces:** Slack (Block Kit) + Web Dashboard (SPA)
**Owner of this doc:** Backend / Agent Pipeline team

> This spec is the contract between the agent pipeline and the frontend. Endpoints, payloads, and the real-time event stream are the parts you can start mocking against **today** — everything else is layout and UX guidance.

---

## 0. Stack Assumptions & Ground Rules

These are recommendations, not mandates — swap freely, but the API contracts in §3 assume this shape.

| Concern | Recommendation | Why |
|---|---|---|
| Framework | **React + TypeScript + Vite** | Fast HMR for a hackathon; TS makes the payloads in §3 self-documenting |
| Styling | **Tailwind CSS** + `shadcn/ui` | Ship polished UI without hand-rolling components |
| Data fetching | **TanStack Query** | Caching, background refetch, and it pairs cleanly with the SSE invalidation pattern in §3.4 |
| Charts | **Recharts** | Enough for trend lines + heatmaps without a heavy license |
| Real-time | **SSE (EventSource)** | One-way backend→frontend status updates — simpler than WebSocket, no handshake to babysit (see §3.4) |
| Image annotation | **SVG overlay on a positioned `<img>`** | Bounding boxes are just `<rect>` in normalized coords — no canvas needed |

**Non-negotiables**
- Every list/grid needs **loading, empty, and error** states. These are graded, not optional (see §5).
- All money/quantities come from the backend already formatted where noted — don't recompute business logic on the client.
- Coordinates in bounding boxes are **normalized 0–1**, not pixels (see §4.1).

---

## 1. Application Scope & User Journey

SupplyPulse has **two surfaces sharing one backend**. They are not equal: Slack is the *capture + approve* surface (fast, mobile, in-the-aisle), the Dashboard is the *analyze + configure* surface (desk, big screen).

### 1.1 Surface split

| | **Slack** | **Web Dashboard** |
|---|---|---|
| Primary user | Store staff on the floor | Manager / ops |
| Core job | Snap a shelf photo, approve reorders | Analytics, thresholds, reorder history |
| Device | Mobile-first | Desktop-first |
| Interaction | Conversational, button-driven | Rich, data-dense |

### 1.2 Slack flow (staff)

1. Staff member uploads a **shelf photo** into the SupplyPulse channel/DM.
2. Bot immediately replies with a **"Processing…" message** that updates in place as the pipeline runs (status stages in §3.4).
3. When done, bot posts a **result card**: detected items, current vs. threshold counts, and a proposed reorder.
4. Staff taps **Approve Order**, **Adjust Count**, or **View Full Sheet** (Block Kit UI in §2.3).
5. On approval, bot confirms and the reorder is logged (Google Sheet row + Dashboard reorder log update in real time).

### 1.3 Dashboard flow (manager)

1. Land on **Live Inventory Grid** — every SKU with current count, threshold, and status color.
2. Drill into a product → history, trend chart, last shelf scan with bounding boxes.
3. Manage **thresholds** (the numbers that trigger a reorder).
4. Review the **Visual Restock Queue** — everything currently below threshold, ranked by urgency.
5. Watch **Google Sheets Sync Status** to confirm the reorder log is writing through.

### 1.4 ⭐ The "1-Photo Restock" magic moment

This is the demo centerpiece. The entire value prop compresses into **one photo → one tap → order placed**. Design the whole Slack result card around making this feel instant and inevitable.

```
 [Staff uploads 1 photo]
        │
        ▼
 ┌─────────────────────────────┐
 │  Analyzing image…           │ ← live status, updates in place (~seconds)
 │  Matching product catalog…  │
 │  Calculating reorder…       │
 │  ✅ Reorder ready           │
 └─────────────────────────────┘
        │
        ▼
 ┌─────────────────────────────┐
 │ 📦 3 items low               │
 │ • Oat Milk    2 / 12  🔴    │
 │ • Cola 330ml  5 / 24  🟠    │
 │ • Napkins     8 / 20  🟡    │
 │ [ Approve Order ] [ Adjust ]│  ← ONE tap here = done
 └─────────────────────────────┘
```

**UX requirements for the magic moment**
- The status message **must update in place** (same Slack `ts`), not spam new messages. Backend re-posts via `chat.update`; your job on the dashboard side is to reflect the same stages via SSE.
- Time-to-first-feedback < 1s: show "Analyzing…" the instant the upload is acknowledged, before any model runs.
- The Approve button should be the visually dominant action (primary/green style).

---

## 2. Component Hierarchy & Page Architecture

### 2.1 Dashboard route map

```
/                        → redirect to /inventory
/inventory               → Live Inventory Grid (default landing)
/inventory/:sku          → Product Detail (history, trend, last scan)
/restock                 → Visual Restock Queue
/scans                   → Shelf Scan History
/scans/:scanId           → Single scan w/ bounding-box overlay
/thresholds              → Threshold Management
/settings/sync           → Google Sheets Sync Status
```

### 2.2 Component tree

```
<AppShell>
├── <TopBar>                     (search, sync badge, live-status pill)
├── <SideNav>                    (Inventory · Restock · Scans · Thresholds · Sync)
└── <RouteOutlet>
    ├── <InventoryGrid>
    │   ├── <InventoryFilters>   (status, category, search)
    │   ├── <InventoryCard[]>    (thumbnail, name, count/threshold, status dot)
    │   └── <EmptyState /> <ErrorState /> <GridSkeleton />
    │
    ├── <ProductDetail>
    │   ├── <ProductHeader>
    │   ├── <TrendChart>         (Recharts line: count over time)
    │   ├── <LastScanPanel>      (image + bounding boxes, §4.1)
    │   └── <ReorderHistoryTable>
    │
    ├── <RestockQueue>
    │   ├── <UrgencyHeatmap>     (§4.2)
    │   └── <RestockCard[]>      (item, deficit, urgency, [Approve] [Preview])
    │
    ├── <ScanHistory> / <ScanDetail>
    │   └── <BoundingBoxViewer>  (§4.1)
    │
    ├── <ThresholdManager>
    │   └── <ThresholdRow[]>     (SKU, min level, reorder qty, save-on-blur)
    │
    └── <SyncStatusPanel>
        └── <SyncTimeline>       (last write, row count, errors)
```

### 2.3 Slack Block Kit wireframes

Slack UI is **JSON Block Kit**, not HTML/CSS. Below are the two cards the backend will send — you may not build these yourself, but the frontend engineer often owns the Block Kit templating, so they're specced here. Test them live in the [Block Kit Builder](https://app.slack.com/block-kit-builder).

**A. Live status message** (updated in place per stage):

```json
{
  "blocks": [
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": ":mag: *Analyzing shelf photo…*\n\n`▓▓▓░░░░░` Matching product catalog" }
    },
    { "type": "context", "elements": [
      { "type": "mrkdwn", "text": "Scan `scan_8f2a` · started 3s ago" }
    ]}
  ]
}
```

**B. Reorder result card** (the magic-moment card):

```json
{
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "📦 3 items below threshold" } },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Oat Milk*\n2 / 12  :red_circle:" },
        { "type": "mrkdwn", "text": "*Cola 330ml*\n5 / 24  :large_orange_circle:" },
        { "type": "mrkdwn", "text": "*Napkins*\n8 / 20  :large_yellow_circle:" }
      ]
    },
    { "type": "divider" },
    {
      "type": "actions",
      "block_id": "reorder_scan_8f2a",
      "elements": [
        {
          "type": "button",
          "style": "primary",
          "text": { "type": "plain_text", "text": "✅ Approve Order" },
          "action_id": "approve_order",
          "value": "plan_1c9d"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "✏️ Adjust Count" },
          "action_id": "adjust_count",
          "value": "plan_1c9d"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "📄 View Full Sheet" },
          "url": "https://docs.google.com/spreadsheets/d/…",
          "action_id": "view_sheet"
        }
      ]
    }
  ]
}
```

**Adjust Count** opens a Slack **modal** (`views.open`) with a numeric input per detected item — one `input` block per SKU, submitted back to the backend which recalculates the plan.

---

## 3. Frontend Data Requirements & API Contracts

Base URL: `/api/v1`. All responses JSON. All timestamps ISO 8601 UTC. Auth: `Authorization: Bearer <token>` (mock-friendly in dev).

### 3.1 Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/shelf-scans` | Upload/kick off a scan (Slack does this; dashboard may re-trigger) |
| `GET` | `/shelf-scans/:id` | Fetch one scan + detections |
| `GET` | `/inventory` | Full inventory grid |
| `GET` | `/inventory/:sku` | Single product + history |
| `PATCH` | `/inventory/:sku/threshold` | Update threshold / reorder qty |
| `GET` | `/reorder-plans` | List reorder plans (queue + history) |
| `POST` | `/reorder-plans/:id/approve` | Approve a plan |
| `GET` | `/sync/status` | Google Sheets sync state |
| `GET` | `/events` | **SSE stream** (§3.4) |

### 3.2 Core payloads

**`GET /inventory`**
```json
{
  "items": [
    {
      "sku": "OATML-1L",
      "name": "Oat Milk 1L",
      "category": "Dairy Alt",
      "thumbnailUrl": "https://cdn.supplypulse.app/thumb/oatml.jpg",
      "currentCount": 2,
      "threshold": 12,
      "reorderQty": 24,
      "status": "critical",           // "ok" | "low" | "critical"
      "lastScanId": "scan_8f2a",
      "updatedAt": "2026-09-13T09:12:04Z"
    }
  ],
  "meta": { "total": 128, "lowCount": 3 }
}
```
> `status` is computed **server-side** — render the color from it, don't derive it from count/threshold yourself (business rules may change).

**`GET /shelf-scans/:id`** — drives the bounding-box viewer (§4.1)
```json
{
  "scanId": "scan_8f2a",
  "imageUrl": "https://cdn.supplypulse.app/scans/8f2a.jpg",
  "imageWidth": 1600,
  "imageHeight": 1200,
  "status": "complete",             // "processing" | "complete" | "failed"
  "detections": [
    {
      "sku": "OATML-1L",
      "label": "Oat Milk 1L",
      "confidence": 0.94,
      "count": 2,
      "bbox": { "x": 0.12, "y": 0.30, "w": 0.18, "h": 0.42 }   // normalized 0–1
    }
  ],
  "createdAt": "2026-09-13T09:11:58Z"
}
```

**`GET /reorder-plans`**
```json
{
  "plans": [
    {
      "planId": "plan_1c9d",
      "scanId": "scan_8f2a",
      "status": "pending",          // "pending" | "approved" | "dispatched"
      "urgencyScore": 0.87,          // 0–1, drives heatmap + sort
      "lines": [
        { "sku": "OATML-1L", "name": "Oat Milk 1L", "currentCount": 2, "threshold": 12, "orderQty": 24, "supplier": "NordMilk AB" }
      ],
      "sheetUrl": "https://docs.google.com/spreadsheets/d/…",
      "createdAt": "2026-09-13T09:12:10Z"
    }
  ]
}
```

**`PATCH /inventory/:sku/threshold`** → body `{ "threshold": 10, "reorderQty": 20 }` → returns the updated item.

**`POST /reorder-plans/:id/approve`** → returns the plan with `status: "approved"` and a populated `sheetUrl`.

**`GET /sync/status`**
```json
{
  "provider": "google_sheets",
  "state": "healthy",               // "healthy" | "syncing" | "error"
  "lastSyncAt": "2026-09-13T09:12:12Z",
  "rowsWritten": 342,
  "lastError": null,
  "sheetUrl": "https://docs.google.com/spreadsheets/d/…"
}
```

### 3.3 Error shape (all endpoints)
```json
{ "error": { "code": "SCAN_NOT_FOUND", "message": "No scan with id scan_8f2a" } }
```

### 3.4 Real-time updates (SSE)

Open **one** `EventSource('/api/v1/events')` at app shell mount. The backend emits pipeline progress and data-change events. Use them to (a) drive the live-status pill and any open scan/plan view, and (b) invalidate TanStack Query caches so grids refresh without polling.

**Pipeline stages** (mirror the Slack magic moment):
`analyzing` → `matching_catalog` → `calculating_reorder` → `sheet_generated` → `complete`

**Event format:**
```
event: scan.status
data: {"scanId":"scan_8f2a","stage":"matching_catalog","progress":0.4}

event: scan.status
data: {"scanId":"scan_8f2a","stage":"sheet_generated","progress":0.9}

event: plan.created
data: {"planId":"plan_1c9d","scanId":"scan_8f2a","urgencyScore":0.87}

event: inventory.updated
data: {"skus":["OATML-1L","COLA-330"]}

event: sync.status
data: {"state":"syncing"}
```

**Handling pattern:**
```ts
const es = new EventSource("/api/v1/events");

es.addEventListener("scan.status", (e) => {
  const { scanId, stage, progress } = JSON.parse(e.data);
  setScanStatus(scanId, stage, progress);          // updates the stepper UI
});

es.addEventListener("inventory.updated", (e) => {
  const { skus } = JSON.parse(e.data);
  queryClient.invalidateQueries({ queryKey: ["inventory"] });
});
```

Show a **connection indicator** in the TopBar; auto-reconnect on `onerror` (EventSource does this natively, but surface a "reconnecting…" state).

---

## 4. Creative "Jury-Winning" UX Features

Pick these three. Each is scoped to be buildable in a hackathon window and each has a clear "wow" beat in the demo.

### 4.1 Bounding-box overlay on shelf images ⭐ (highest ROI)

Render the uploaded photo with **animated detection boxes** drawn over recognized products — this makes the AI *visible* and is the single most demo-friendly feature.

**Implementation** (SVG over a positioned image, normalized coords → no math on resize):
```tsx
<div className="relative inline-block">
  <img src={scan.imageUrl} className="block w-full rounded-lg" />
  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1 1" preserveAspectRatio="none">
    {scan.detections.map((d) => (
      <g key={d.sku}>
        <rect x={d.bbox.x} y={d.bbox.y} width={d.bbox.w} height={d.bbox.h}
              fill="none" stroke={colorFor(d.confidence)} strokeWidth={0.004} />
      </g>
    ))}
  </svg>
  {/* labels in a separate absolutely-positioned layer so text isn't scaled by viewBox */}
</div>
```
**Polish:** boxes fade/draw in sequentially as `scan.status` events arrive; box color encodes confidence (green ≥0.9, amber 0.7–0.9, red <0.7); hover a box → highlight the matching inventory row.

### 4.2 Restock urgency heatmap

A grid where each SKU tile's color intensity maps to `urgencyScore` (from `/reorder-plans`). Lets a manager grasp "what's on fire" in one glance, and it sorts the Visual Restock Queue.

- Tile color: `hsl(0, 80%, L%)` where `L = 90 - urgencyScore*45` (pale → deep red).
- Click a tile → jump to that product's reorder card.
- Bonus: a subtle pulse animation on tiles with `urgencyScore > 0.85`.

### 4.3 One-click supplier dispatch preview

Before approving, show a **preview modal** of exactly what will be ordered and from whom — grouped by supplier, with totals. Turns "Approve Order" from a leap of faith into a confident click.

```
┌── Dispatch Preview ──────────────┐
│ NordMilk AB                      │
│  • Oat Milk 1L      ×24          │
│ ─────────────────────────────── │
│ BevCo                            │
│  • Cola 330ml       ×24          │
│                                  │
│ 2 suppliers · 3 SKUs · 72 units  │
│      [ Cancel ]  [ Confirm ✅ ]  │
└──────────────────────────────────┘
```
Data is already in `/reorder-plans` (`lines[].supplier`, `orderQty`) — just group by supplier client-side.

---

## 5. Definition of Done (per view)

Every shipped view must handle:

- [ ] **Loading** — skeletons, not spinners, for grids/tables
- [ ] **Empty** — friendly zero-state with a next action
- [ ] **Error** — the §3.3 error shape rendered with a retry
- [ ] **Real-time** — reflects relevant SSE events without a manual refresh
- [ ] **Responsive** — dashboard is desktop-first but must not break on tablet
- [ ] **Optimistic where safe** — threshold edits and approvals feel instant, reconcile on response

---

## 6. Suggested build order (unblock the demo fastest)

1. **AppShell + SSE plumbing** + mock server for §3 payloads.
2. **Inventory Grid** (`/inventory`) — proves the data contract end to end.
3. **Bounding-box viewer** (§4.1) — the demo hero; build against a single canned scan.
4. **Restock Queue + urgency heatmap** (§4.2).
5. **Dispatch preview + approve flow** (§4.3), wired to `POST /reorder-plans/:id/approve`.
6. **Thresholds** + **Sync Status** panels.
7. Slack Block Kit templates (§2.3) — often owned jointly with backend.

> Mock everything in §3 first (MSW or a tiny Express stub). The frontend should never be blocked waiting on the live pipeline — the contracts above are frozen enough to build against now.
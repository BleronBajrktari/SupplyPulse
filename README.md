# 📦 SupplyPulse — AI Inventory Manager for Small Shops

> One shelf photo → full restocking plan in under 60 seconds.

SupplyPulse is a multi-app AI agent that automates inventory management for small retail shops. A shop owner snaps a photo of their shelves, and the agent autonomously detects products, matches them against a live catalog, calculates reorder priorities using sales velocity data, writes the reorder plan to a spreadsheet, and sends an actionable Slack alert — all from a single image upload.

---

## 🎥 Demo

**[▶ Watch the 2-minute demo](https://your-demo-link-here.com)**

---
## 📂 Repository Structure

This project is split into two branches:

| Branch | Contents | Link |
|--------|----------|------|
| **[`feat/dea-backend`](https://github.com/BleronBajrktari/SupplyPulse/tree/feat/dea-backend)** | Python backend — FastAPI server, AI agent pipeline, 5 live integrations | [View Backend →](https://github.com/BleronBajrktari/SupplyPulse/tree/feat/dea-backend) |
| **[`feature/frontend`](https://github.com/BleronBajrktari/SupplyPulse/tree/feature/frontend)** | React frontend — Scan UI, results dashboard, catalog viewer, health board | [View Frontend →](https://github.com/BleronBajrktari/SupplyPulse/tree/feature/frontend) |


## 🏗️ How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Shelf Photo │────▶│  Claude Vision    │────▶│  AI Matcher      │
│  (Upload)    │     │  (AWS Bedrock)    │     │  (Claude AI)     │
└──────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                     ┌──────────────────┐              │
                     │  Notion API      │◀─────────────┤ Fetch catalog
                     │  (Product DB)    │              │
                     └──────────────────┘              │
                                                       │
                     ┌──────────────────┐              │
                     │  Google Sheets   │◀─────────────┤ Read velocity
                     │  (Sales Data)    │              │ Write reorder
                     └──────────────────┘              │
                                                       │
                     ┌──────────────────┐              │
                     │  Reorder Engine  │◀─────────────┘
                     │  (Math + Scoring)│
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │  Slack Webhook   │
                     │  (Alert Delivery)│
                     └──────────────────┘
```

### Pipeline Steps:

1. **Claude Vision (AWS Bedrock)** — Analyzes the shelf photo, detects 20–30 products with quantity estimates and confidence scores
2. **Notion API** — Fetches the product catalog (SKU IDs, pricing, safety thresholds, lead times)
3. **Google Sheets API (Read)** — Loads 90-day sales velocity and seasonality multipliers per SKU
4. **AI-Powered Matching (Claude)** — Intelligently matches detected products to catalog entries using semantic understanding, not just string comparison
5. **Reorder Math Engine** — Calculates `(velocity × lead_time × seasonality) + safety_stock − visual_stock` per item, rounds to case sizes, and scores urgency 0–100
6. **Google Sheets API (Write)** + **Slack Webhook** — Appends the full reorder plan to the spreadsheet and sends a formatted alert with priority tiers and action buttons

---

## 🔌 External Apps Integrated 

| # | App | Role | Integration Method |
|---|-----|------|--------------------|
| 1 | **AWS Bedrock (Claude Vision)** | Shelf image analysis — product detection, quantity estimation, confidence scoring | `boto3` → `invoke_model` with Claude Sonnet 4 |
| 2 | **Notion** | Product catalog database — SKUs, pricing, thresholds, lead times, case sizes | REST API (`requests`) → `databases/{id}/query` |
| 3 | **Google Sheets** | Sales velocity data source + reorder output destination | `gspread` + Google Service Account |
| 4 | **Slack** | Real-time alert delivery with urgency tiers and approval buttons | Incoming Webhook (`requests.post`) |
| 5 | **Claude AI (Matching)** | Semantic product matching — understands "Cheez-It Original, red box" = "Cheez-It Original Crackers" | `boto3` → second `invoke_model` call |

---

## 📊 What the Agent Produces

- **Urgency-scored reorder plan** — each item ranked 0–100 based on stockout velocity, profit margin loss, and supplier lead time
- **Priority tiers** — 🔴 URGENT (order today), 🟡 HIGH (order this week), 🟢 MEDIUM (monitor)
- **Formatted Slack alert** — Block Kit message with per-item costs, quantities, lead times, and Approve/View Sheet/Dismiss buttons
- **Google Sheets report** — timestamped rows with SKU, quantity, cost, urgency score, and confidence
- **Low-confidence handling** — items below 50% confidence flagged for manual review, occluded items get averaged quantity estimates

---

## 🖥️ Tech Stack

**Backend:**
- Python 3.12
- FastAPI + Uvicorn (HTTP server with SSE streaming)
- boto3 (AWS Bedrock)
- gspread + google-auth (Google Sheets)
- requests (Notion API, Slack Webhook)

**Frontend:**
- React 18 + TypeScript (Vite)
- Tailwind CSS v4 (dark mode)
- Recharts (data visualization)
- Lucide React (icons)

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- AWS account with Bedrock access (Claude Sonnet 4)
- Notion account + integration token
- Google Cloud service account with Sheets API enabled
- Slack workspace with an incoming webhook

### 1. Clone the repo

```bash
git clone https://github.com/BleronBajrktari/SupplyPulse.git
cd SupplyPulse
```

### 2. Backend setup

```bash
cd supplypulse-backend
pip install -r requirements.txt
```

Create a `.env` file:

```env
# AWS Bedrock
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0

# Notion
NOTION_API_KEY=ntn_your_token
NOTION_DATABASE_ID=your_32char_hex_id

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials/google_service_account.json
GOOGLE_SHEET_ID=your_sheet_id

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Logging
LOG_LEVEL=INFO
```

Place your Google service account JSON at `credentials/google_service_account.json`.

Start the backend:

```bash
uvicorn server:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd supplypulse-frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Notion database setup

Create a Notion database with these columns:

| Column | Type |
|--------|------|
| `sku_id` | Title |
| `product_name` | Text |
| `category` | Select |
| `minimum_safety_threshold` | Number |
| `cost_price_per_unit` | Number |
| `retail_price_per_unit` | Number |
| `typical_reorder_lead_time_days` | Number |
| `reorder_unit_quantity` | Number |

Connect your Notion integration to the database (⋯ → Connections → your integration).

### 5. Google Sheets setup

Create a spreadsheet with a `SalesVelocity` tab:

| sku_id | avg_daily_velocity | seasonality_factor | trend |
|--------|-------------------|--------------------|-------|
| SKU_001 | 3.2 | 0.95 | increasing |

Share the sheet with your service account email (Editor access).

---

## 🧪 How We Tested Reliability

### Integration Reliability
- **Health endpoint** (`GET /health`) — pings all 5 services and returns status + latency. Used before every demo to verify connectivity.
- **Graceful fallback** — if any integration fails (Notion down, Sheets timeout), the pipeline falls back to local mock data and continues. No single point of failure stops the agent.
- **Retry logic** — Claude Vision calls include timeout handling. Failed Notion/Sheets calls are caught and logged without crashing the pipeline.

### Detection Accuracy
- Tested with 5+ different shelf photos across convenience store layouts
- Claude Vision consistently detects 20–30 SKUs per image with 70–95% confidence
- AI matcher achieves ~50% catalog match rate (vs ~13% with the original fuzzy string matcher — a 4x improvement)

### Data Integrity
- Every scan writes timestamped rows to Google Sheets for audit trail
- Reorder quantities validated against case sizes (always rounds up to full cases)
- Urgency scores cross-checked: items with 1–2 units on shelf and high velocity correctly rank as HIGH/URGENT
- Empty shelf spaces correctly flagged as MANUAL REVIEW (never false-matched to a product)

### End-to-End Testing
- Full pipeline tested via CLI (`python test_agent.py`) and via the frontend UI
- SSE streaming verified: all 6 pipeline steps stream progress in real time to the browser
- Slack alerts verified: Block Kit messages arrive with correct urgency tiers, costs, and action buttons
- Google Sheets verified: ReorderOutput tab auto-populated with correct data after every scan

### Integration Health Dashboard
- Live status board in the UI shows all 5 connections with latency (typically 150–800ms per service)
- All integrations confirmed working in production:
  ```
  ✅ AWS Bedrock (Claude Vision)  — 812ms
  ✅ Notion Catalog               — 194ms
  ✅ Google Sheets Read            — 231ms
  ✅ Google Sheets Write           — 267ms
  ✅ Slack Webhook                 — 148ms
  ```

---

## 📁 Project Structure

```
SupplyPulse/
├── supplypulse-backend/
│   ├── server.py                 # FastAPI server (6 endpoints, SSE streaming)
│   ├── supplypulse_agent.py      # Core AI pipeline (Vision + AI Matcher + Math)
│   ├── notion_integration.py     # Notion API client
│   ├── sheets_integration.py     # Google Sheets read/write
│   ├── slack_integration.py      # Slack webhook sender
│   ├── mock_data.py              # Fallback data for offline mode
│   ├── populate_notion.py        # Script to seed Notion with products
│   ├── test_agent.py             # CLI pipeline runner for testing
│   └── requirements.txt
│
└── supplypulse-frontend/
    ├── src/
    │   ├── pages/                # Scan, Results, Catalog, Velocity, Health, AlertLog
    │   ├── components/           # UI components (heatmap, urgency badges, etc.)
    │   ├── lib/api.ts            # API client with SSE streaming
    │   └── App.tsx               # Router
    ├── package.json
    └── vite.config.ts
```

---

## 👥 Team

| Name | Role |
|------|------|
| **Dea Berisha** | Backend & AI Agent Architecture |
| **Bleron Bajraktari** | Frontend & UI Design |

---

## 📝 License

Built for the Multi-App AI Agent Hackathon, September 2026.

# SupplyPulse

AI-driven retail inventory agent. A shop owner uploads one shelf photo and a
single Claude agent runs the full **perceive → reason → act** loop across four
tools — detecting stock, matching it to the catalog, calculating reorders, and
writing the purchase order — with a human approving in one tap.

## Project overview

Small shop and mall owners don't have time to track inventory. SupplyPulse turns
a single shelf photo into a ready-to-approve restock order. One Claude agent
orchestrates the whole pipeline:

1. **Vision** — detects products and counts from the uploaded shelf photo
2. **Notion** — matches detections against the product catalog (source of truth for SKUs, pricing, reorder rules)
3. **Claude** — compares counts vs. thresholds and calculates reorder quantities
4. **Google Sheets + Slack** — writes the purchase order to a sheet and posts an approval card to the team

The web dashboard makes the agent's work visible: a live pipeline view, an
integration health strip, live inventory, an urgency-ranked restock queue with
per-order reasoning, threshold management, and a sync log.

## External apps used

- **Anthropic Claude** — vision (shelf detection) and reasoning (reorder calculation)
- **AWS Bedrock** — hosting/serving the Claude vision calls
- **Notion** — product catalog / source of truth
- **Google Sheets** — purchase-order log (read for sales velocity, write for POs)
- **Slack** — worker interface: photo upload and approval cards

**Frontend stack:** React + TypeScript + Vite, Tailwind CSS v4, React Router, Recharts, lucide-react.
**Backend stack:** Python, FastAPI, Uvicorn.

## Demo

📹 Two-minute demo: [View Demo on Google Drive](https://drive.google.com/drive/folders/11NybPe-UrSWXFpfQhzcAQOIvcvD3wlwD?usp=drive_link)
## Setup instructions

To run the fully integrated application locally, you will need to start both the Python backend and the Vite frontend.

**1. Clone the repository**
```bash
git clone https://github.com/BleronBajrktari/SupplyPulse
cd SupplyPulse

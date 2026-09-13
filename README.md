# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
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

## Setup instructions

To run the fully integrated application locally, you will need to start both the Python backend and the Vite frontend.

**1. Clone the repository**
```bash
git clone https://github.com/BleronBajrktari/SupplyPulse
cd SupplyPulse

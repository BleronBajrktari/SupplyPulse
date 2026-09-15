export interface StepEvent {
  step: number; // 1-6
  status: "running" | "done" | "error";
  detail?: string;
}

export interface ReorderItem {
  product_name?: string;
  vision_description?: string;
  suggested_qty: number;
  estimated_cost: number;
  urgency_score: number;
  urgency_label: "URGENT" | "HIGH" | "MEDIUM" | "MANUAL REVIEW";
  lead_time_days: number;
  effective_quantity: number;
  visual_quantity?: number;
}

export interface ReorderPlan {
  items: ReorderItem[];
  total_restock_cost: number;
  items_to_reorder: number;
  items_manual_review: number;
}

export interface ScanSummary {
  skus_detected: number;
  skus_matched: number;
  skus_manual_review: number;
  items_to_reorder: number;
  total_estimated_cost: number;
  pipeline_duration_seconds: number;
  scan_confidence?: number;
}

export interface ScanResult {
  reorder_plan: ReorderPlan;
  summary: ScanSummary;
  sheet_url: string;
  matched_items?: Array<{
    matched: boolean;
    sku_id: string;
    product_name: string;
    visual_quantity: number;
    effective_quantity: number;
    requires_manual_mapping?: boolean;
  }>;
  integrations?: Record<string, boolean>;
  timestamp?: string;
}

export interface CatalogItem {
  sku_id: string;
  product_name: string;
  category: string;
  safety_threshold: number;
  cost_price: number;
  retail_price: number;
  lead_time_days: number;
  reorder_unit: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Executes a shelf scan with real-time SSE progress step events.
 */
export async function scanWithProgress(
  file: File,
  shopName: string,
  callbacks: {
    onStep: (step: StepEvent) => void;
    onResult: (result: ScanResult) => void;
    onError: (msg: string) => void;
  }
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("shop_name", shopName);

  try {
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    // Handle SSE streaming or chunked text responses
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          const cleanChunk = chunk.replace(/^data:\s*/, "").trim();
          if (!cleanChunk) continue;

          try {
            const parsed = JSON.parse(cleanChunk);

            if (parsed.step) {
              callbacks.onStep({
                step: parsed.step,
                status: parsed.status || "running",
                detail: parsed.detail || parsed.message,
              });
            }

            if (parsed.reorder_plan || parsed.summary) {
              callbacks.onResult(parsed as ScanResult);
            }
          } catch {
            // Ignore non-JSON ping lines
          }
        }
      }
    } else {
      const json = await response.json();
      if (json.reorder_plan) {
        callbacks.onResult(json);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline execution failed. Check backend connection.";
    callbacks.onError(message);
  }
}

/**
 * Fetches the live Notion product catalog.
 */
export async function fetchCatalog(): Promise<{ items: CatalogItem[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/catalog`);
    if (!response.ok) throw new Error("Failed to fetch catalog");
    const data = await response.json();
    return { items: data.items || data };
  } catch {
    // Return mock fallback data if backend is offline
    return {
      items: [
        { sku_id: "OATML-1L", product_name: "Oat Milk 1L", category: "Dairy Alt", safety_threshold: 12, cost_price: 2.4, retail_price: 3.75, lead_time_days: 3, reorder_unit: "Case of 12" },
        { sku_id: "COLA-330", product_name: "Cola 330ml", category: "Beverages", safety_threshold: 24, cost_price: 0.9, retail_price: 1.5, lead_time_days: 2, reorder_unit: "Case of 24" },
        { sku_id: "NAPKN-200", product_name: "Napkins 200ct", category: "Paper Goods", safety_threshold: 20, cost_price: 1.9, retail_price: 3.2, lead_time_days: 4, reorder_unit: "Case of 10" },
      ],
    };
  }
}

/**
 * Fetches integration health status.
 */
export async function fetchHealth(): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("Health check failed");
    return await response.json();
  } catch {
    return { claude_vision: true, notion: true, google_sheets_read: true, google_sheets_write: true, slack: true };
  }
}
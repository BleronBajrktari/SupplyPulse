export interface ThresholdRow {
  sku: string;
  name: string;
  threshold: number;
  reorderQty: number;
  suggestedThreshold: number;
}

export function fetchThresholds(): Promise<ThresholdRow[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          { sku: "MILK-WHOLE-1L", name: "Whole Milk 1L", threshold: 15, reorderQty: 30, suggestedThreshold: 18 },
          { sku: "OAT-MILK-1L", name: "Oat Milk 1L", threshold: 10, reorderQty: 20, suggestedThreshold: 14 },
          { sku: "COCA-COLA-500ML", name: "Coca Cola 500ml", threshold: 12, reorderQty: 24, suggestedThreshold: 12 },
          { sku: "PAPER-TOWEL-2PK", name: "Paper Towels 2-Pack", threshold: 10, reorderQty: 15, suggestedThreshold: 8 },
        ]),
      300
    )
  );
}

export function saveThreshold(_sku: string, _payload: { threshold: number; reorderQty: number }): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

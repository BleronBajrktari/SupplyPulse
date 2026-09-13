import type { ReorderPlan } from "../types/restock";

export function fetchReorderPlans(): Promise<{ plans: ReorderPlan[] }> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          plans: [
            {
              planId: "plan_8f01",
              scanId: "scan_8f2a",
              status: "pending",
              urgencyScore: 0.92,
              sheetUrl: "https://docs.google.com/spreadsheets/d/demo",
              createdAt: new Date().toISOString(),
              generatedBy: "Claude",
              rationale:
                "Both SKUs fell below 20% of their threshold in the latest shelf scan (scan_8f2a). Order quantities are sized to the same supplier's case pack so this ships as a single NordMilk AB order.",
              lines: [
                { sku: "MILK-WHOLE-1L", name: "Whole Milk 1L", currentCount: 2, threshold: 15, orderQty: 30, supplier: "NordMilk AB", daysOfCover: 1, leadTimeDays: 3 },
                { sku: "OAT-MILK-1L", name: "Oat Milk 1L", currentCount: 1, threshold: 10, orderQty: 20, supplier: "NordMilk AB", daysOfCover: 1, leadTimeDays: 3 },
              ],
            },
            {
              planId: "plan_8f02",
              scanId: "scan_3b11",
              status: "pending",
              urgencyScore: 0.74,
              sheetUrl: "https://docs.google.com/spreadsheets/d/demo",
              createdAt: new Date().toISOString(),
              generatedBy: "Claude",
              rationale:
                "Coca Cola 500ml is at 33% of threshold with steady sell-through over the past week, so this was queued as medium urgency rather than escalated as critical.",
              lines: [
                { sku: "COCA-COLA-500ML", name: "Coca Cola 500ml", currentCount: 4, threshold: 12, orderQty: 24, supplier: "BevCo", daysOfCover: 2, leadTimeDays: 2 },
              ],
            },
            {
              planId: "plan_8f03",
              scanId: "scan_9c4d",
              status: "approved",
              urgencyScore: 0.45,
              sheetUrl: "https://docs.google.com/spreadsheets/d/demo",
              createdAt: new Date().toISOString(),
              generatedBy: "Claude",
              rationale:
                "Paper Towels 2-Pack is close to threshold (8/10) with low urgency; order quantity matches PaperCo's minimum case size to avoid a partial-case order.",
              lines: [
                { sku: "PAPER-TOWEL-2PK", name: "Paper Towels 2-Pack", currentCount: 8, threshold: 10, orderQty: 15, supplier: "PaperCo", daysOfCover: 4, leadTimeDays: 5 },
              ],
            },
          ],
        }),
      300
    )
  );
}
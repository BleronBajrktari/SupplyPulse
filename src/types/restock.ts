export type ReorderPlanStatus = "pending" | "approved" | "dispatched";

export interface ReorderLine {
  sku: string;
  name: string;
  currentCount: number;
  threshold: number;
  orderQty: number;
  supplier: string;
  daysOfCover: number;
  leadTimeDays: number;
}

export interface ReorderPlan {
  planId: string;
  scanId: string;
  status: ReorderPlanStatus;
  urgencyScore: number;
  lines: ReorderLine[];
  sheetUrl: string;
  createdAt: string;
  generatedBy: string;
  rationale: string;
}

export interface SupplierGroup {
  supplier: string;
  lines: ReorderLine[];
  units: number;
}

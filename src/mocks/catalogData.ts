export interface CatalogEntry {
  sku_id: string
  product_name: string
  category: string
  safety_threshold: number
  cost_price: number
  retail_price: number
  lead_time_days: number
  reorder_unit: string
}

const CATALOG: CatalogEntry[] = [
  { sku_id: 'OATML-1L', product_name: 'Oat Milk 1L', category: 'Dairy Alt', safety_threshold: 12, cost_price: 2.4, retail_price: 3.75, lead_time_days: 3, reorder_unit: 'Case of 12' },
  { sku_id: 'COLA-330', product_name: 'Cola 330ml', category: 'Beverages', safety_threshold: 24, cost_price: 0.9, retail_price: 1.5, lead_time_days: 2, reorder_unit: 'Case of 24' },
  { sku_id: 'NAPKN-200', product_name: 'Napkins 200ct', category: 'Paper Goods', safety_threshold: 20, cost_price: 1.9, retail_price: 3.2, lead_time_days: 4, reorder_unit: 'Case of 10' },
  { sku_id: 'CHIPS-BBQ', product_name: 'BBQ Chips', category: 'Snacks', safety_threshold: 20, cost_price: 1.1, retail_price: 2.25, lead_time_days: 3, reorder_unit: 'Case of 24' },
  { sku_id: 'BAGEL-6PK', product_name: 'Bagels 6-Pack', category: 'Bakery', safety_threshold: 15, cost_price: 1.6, retail_price: 3.0, lead_time_days: 2, reorder_unit: 'Case of 12' },
  { sku_id: 'WATER-500', product_name: 'Sparkling Water 500ml', category: 'Beverages', safety_threshold: 30, cost_price: 0.55, retail_price: 1.1, lead_time_days: 2, reorder_unit: 'Case of 24' },
  { sku_id: 'PAPTWL-2PK', product_name: 'Paper Towels 2-Pack', category: 'Paper Goods', safety_threshold: 25, cost_price: 2.1, retail_price: 3.9, lead_time_days: 4, reorder_unit: 'Case of 12' },
  { sku_id: 'YOGRT-4PK', product_name: 'Greek Yogurt 4-Pack', category: 'Dairy Alt', safety_threshold: 20, cost_price: 2.8, retail_price: 4.5, lead_time_days: 3, reorder_unit: 'Case of 8' },
  { sku_id: 'PRETZL-BAG', product_name: 'Pretzel Bag', category: 'Snacks', safety_threshold: 18, cost_price: 1.3, retail_price: 2.6, lead_time_days: 3, reorder_unit: 'Case of 18' },
  { sku_id: 'DTRGNT-1L', product_name: 'Dish Detergent 1L', category: 'Household', safety_threshold: 15, cost_price: 1.7, retail_price: 3.3, lead_time_days: 5, reorder_unit: 'Case of 10' },
  { sku_id: 'TOILET-12PK', product_name: 'Toilet Paper 12-Pack', category: 'Household', safety_threshold: 24, cost_price: 4.2, retail_price: 7.5, lead_time_days: 5, reorder_unit: 'Case of 6' },
  { sku_id: 'ICECRM-PT', product_name: 'Ice Cream Pint', category: 'Frozen', safety_threshold: 16, cost_price: 2.2, retail_price: 4.0, lead_time_days: 4, reorder_unit: 'Case of 12' },
  { sku_id: 'SODA-CHERRY', product_name: 'Cherry Soda 330ml', category: 'Beverages', safety_threshold: 24, cost_price: 0.85, retail_price: 1.45, lead_time_days: 2, reorder_unit: 'Case of 24' },
  { sku_id: 'CROISS-4PK', product_name: 'Croissants 4-Pack', category: 'Bakery', safety_threshold: 18, cost_price: 2.0, retail_price: 3.6, lead_time_days: 2, reorder_unit: 'Case of 8' },
]

const MOCK_LATENCY_MS = 350

export function fetchCatalog(): Promise<CatalogEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(CATALOG), MOCK_LATENCY_MS)
  })
}

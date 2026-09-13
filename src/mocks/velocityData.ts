export interface VelocityEntry {
  sku_id: string
  product_name: string
  daily_velocity: number
}

const VELOCITY: VelocityEntry[] = [
  { sku_id: 'WATER-500', product_name: 'Sparkling Water 500ml', daily_velocity: 18.4 },
  { sku_id: 'COLA-330', product_name: 'Cola 330ml', daily_velocity: 15.2 },
  { sku_id: 'CHIPS-BBQ', product_name: 'BBQ Chips', daily_velocity: 12.7 },
  { sku_id: 'SODA-CHERRY', product_name: 'Cherry Soda 330ml', daily_velocity: 11.3 },
  { sku_id: 'BAGEL-6PK', product_name: 'Bagels 6-Pack', daily_velocity: 9.6 },
  { sku_id: 'OATML-1L', product_name: 'Oat Milk 1L', daily_velocity: 8.1 },
  { sku_id: 'CROISS-4PK', product_name: 'Croissants 4-Pack', daily_velocity: 7.4 },
  { sku_id: 'YOGRT-4PK', product_name: 'Greek Yogurt 4-Pack', daily_velocity: 6.8 },
  { sku_id: 'NAPKN-200', product_name: 'Napkins 200ct', daily_velocity: 5.5 },
  { sku_id: 'PRETZL-BAG', product_name: 'Pretzel Bag', daily_velocity: 4.9 },
]

export const SEASONALITY_INDEX = 0.95

const MOCK_LATENCY_MS = 350

export function fetchVelocity(): Promise<VelocityEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(VELOCITY), MOCK_LATENCY_MS)
  })
}

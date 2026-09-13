import { INVENTORY_ITEMS } from './inventoryData'

/** Synthetic 7-day total-unit-deficit projection, scaled off today's real deficit so it stays consistent with inventory. */
export function getDeficitProjection(): { day: string; deficit: number }[] {
  const currentDeficit = INVENTORY_ITEMS.reduce((sum, item) => sum + Math.max(0, item.threshold - item.currentCount), 0)
  const factors = [1, 1.08, 0.95, 0.8, 0.62, 0.5, 0.38]

  return factors.map((factor, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      deficit: Math.round(currentDeficit * factor),
    }
  })
}

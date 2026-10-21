/** @type {{ enabled: boolean, count: number, speed: number, size: number, opacity: number, glass: boolean, blur: number, gridScale: number, gridOpacity: number, glassOpacity: number, fishCount: number, wake: number, color: string }} */
export const defaults = Object.freeze({ enabled: true, count: 3, speed: 1, size: 1, opacity: 0.75, glass: true, blur: 14, gridScale: 1, gridOpacity: .05, glassOpacity: .45, fishCount: 170, wake: 1, color: '#4d6bfe' })
export const ranges = Object.freeze({ count: [1, 6, 1], speed: [0.2, 2, 0.1], size: [0.6, 1.5, 0.1], opacity: [0.15, .95, .05], gridScale: [.75, 2, .05], gridOpacity: [0, .25, .01], fishCount: [0, 340, 10], wake: [0, 3, .1], blur: [0, 32, 1], glassOpacity: [0, 1, .05] })
export const storageKey = 'dsh-ascii-whales:v1'

export function normalize(value) {
  const result = { ...defaults }
  if (!value || typeof value !== 'object') return result
  if (typeof value.enabled === 'boolean') result.enabled = value.enabled
  if (typeof value.glass === 'boolean') result.glass = value.glass
  if (typeof value.color === 'string' && /^#[\da-f]{6}$/i.test(value.color)) result.color = value.color.toLowerCase()
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) {
      result[key] = Math.min(max, Math.max(min, value[key]))
    }
  }
  result.count = Math.round(result.count)
  result.fishCount = Math.round(result.fishCount)
  return result
}

export function readSettings(storage) {
  try { return normalize(JSON.parse(storage.getItem(storageKey))) }
  catch { return { ...defaults } }
}

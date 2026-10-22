/** @type {{ species: 'humpback' | 'orca', enabled: boolean, colorfulShimmer: boolean, eyeColor: 'primary' | 'black' | 'white', count: number, bodySwing: number, turnAgility: number, tailFrequency: number, speed: number, size: number, opacity: number, glass: boolean, blur: number, gridScale: number, gridOpacity: number, glassOpacity: number, fishCount: number, wake: number, color: string, glyphMode: 'ascii' | 'hanzi' | 'kanji', fontSource: 'bundled' | 'local', asciiFont: string, hanziFont: string }} */
export const defaults = Object.freeze({ species: 'humpback', enabled: true, colorfulShimmer: false, eyeColor: 'primary', count: 3, bodySwing: .8, turnAgility: .7, tailFrequency: .8, speed: .65, size: 1.2, opacity: 1, glass: true, blur: 14, gridScale: 1, gridOpacity: .05, glassOpacity: .45, fishCount: 170, wake: 1, color: '#4d6bfe', glyphMode: 'ascii', fontSource: 'bundled', asciiFont: '', hanziFont: '' })
export const ranges = Object.freeze({ count: [1, 20, 1], speed: [0.1, 10, 0.1], bodySwing: [0, 3, .1], turnAgility: [.1, 3, .1], tailFrequency: [.1, 5, .1], size: [0.1, 10, 0.1], opacity: [0, 1, .05], gridScale: [.1, 10, .1], gridOpacity: [0, 1, .01], fishCount: [0, 1000, 10], wake: [0, 10, .1], blur: [0, 64, 1], glassOpacity: [0, 1, .05] })
export const storageKey = 'dsh-ascii-whales:v1'
export const fractionalSteps = ['speed', 'size', 'gridScale', 'wake', 'bodySwing', 'turnAgility', 'tailFrequency']
export const inputStep = (key, value) => fractionalSteps.includes(key) && value < 1 ? .05 : ranges[key][2]

export function normalize(value) {
  const result = { ...defaults }
  if (!value || typeof value !== 'object') return result
  if (value.species === 'humpback' || value.species === 'orca') result.species = value.species
  if (typeof value.enabled === 'boolean') result.enabled = value.enabled
  if (typeof value.colorfulShimmer === 'boolean') result.colorfulShimmer = value.colorfulShimmer
  if (value.eyeColor === 'primary' || value.eyeColor === 'black' || value.eyeColor === 'white') result.eyeColor = value.eyeColor
  if (typeof value.glass === 'boolean') result.glass = value.glass
  if (value.glyphMode === 'ascii' || value.glyphMode === 'hanzi' || value.glyphMode === 'kanji') result.glyphMode = value.glyphMode
  if (value.fontSource === 'bundled' || value.fontSource === 'local') result.fontSource = value.fontSource
  for (const key of ['asciiFont', 'hanziFont']) {
    if (typeof value[key] === 'string' && /^[\p{L}\p{N} ._()\-]{0,100}$/u.test(value[key])) result[key] = value[key]
  }
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

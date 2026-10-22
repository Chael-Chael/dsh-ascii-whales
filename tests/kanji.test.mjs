import test from 'node:test'
import assert from 'node:assert/strict'
import { Ocean } from '../vendor/ascii-kanji-sharks/ocean.js'
import { makeRandom } from '../vendor/ascii-kanji-sharks/util.js'

test('Kanji whales honor population and size, survive resizing and interaction', () => {
  for (const [count, fish, size] of [[3, 170, 1], [20, 0, .1], [1, 1000, 10]]) {
    const ocean = new Ocean(makeRandom(123), count, fish, size)
    ocean.resize(1000, 760, 18)
    assert.equal(ocean.sharks.length, count)
    assert.equal(ocean.fish.length, fish)
    ocean.pointer = { x: 500, y: 300, active: true }
    ocean.splash(500, 300)
    for (let i = 0; i < 120; i++) ocean.step(1 / 60)
    ocean.resize(360, 760, 18)
    for (let i = 0; i < 60; i++) ocean.step(1 / 60)
    for (const shark of ocean.sharks) assert.ok([...shark.nodes].every(Number.isFinite))
    for (const fish of ocean.fish) assert.ok([fish.x, fish.y, fish.vx, fish.vy].every(Number.isFinite))
  }
  const normal = new Ocean(makeRandom(1), 1, 0, 1), large = new Ocean(makeRandom(1), 1, 0, 2)
  normal.resize(1000, 760, 18); large.resize(1000, 760, 18)
  assert.equal(large.sharks[0].L, normal.sharks[0].L * 2)
})

test('Kanji whale anatomy, color, grid, wake and font controls reach the painter', async t => {
  const { Painter } = await import('../vendor/ascii-kanji-sharks/painter.js')
  const previous = new Map()
  const context = new Proxy({ getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4) }), measureText: () => ({ actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 3 }) }, { get: (o, k) => o[k] ?? (() => {}) })
  const canvas = () => ({ getContext: () => context })
  for (const [key, value] of Object.entries({ document: { createElement: canvas }, getComputedStyle: () => ({ fontFamily: 'serif' }) })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
  t.after(() => { for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key] } })
  const painter = new Painter(canvas(), 1)
  painter.resize(1200, 800, 1)
  const ocean = new Ocean(makeRandom(2), 1, 0, 1)
  ocean.resize(1200, 800, 18)
  const whale = ocean.sharks[0]
  whale.L = 600; whale.phase = 0; whale.speed = 0; whale.turn = 0
  // Straight spine isolates silhouette classification from swimming curvature.
  for (let k = 0; k < 16; k++) { painter.spine[k * 2] = k * 40; painter.spine[k * 2 + 1] = 400; painter.arc[k] = k * 40 }
  painter.arcTotal = 600; painter.finLeft = painter.finRight = 600 * .29
  assert.equal(painter.classify(600 * .2, 400 + 600 * .08, 600), 1, 'Former gills are body')
  assert.equal(painter.classify(600 * .7, 400 + 600 * .07, 600), 0, 'No pelvic fins')
  assert.equal(painter.classify(600 * .97, 400 + 600 * .15, 600), 7, 'Broad whale flukes')
  assert.equal(painter.classify(600 * .52, 400 + 600 * .19, 600), 5, 'Long whale flippers')
  for (const dark of [false, true]) {
    painter.setTheme(dark, 0, 0, '#ff0000')
    assert.equal(painter.theme.grid, 'rgba(128,128,128,0)')
    assert.equal(painter.theme.fish.at(-1), 'rgb(255,0,0)')
    painter.energy.fill(1); painter.frame++; painter.touched.length = 0; painter.placeWake()
    assert.equal(painter.touched.length, 0, 'Zero wake hides the wake')
    painter.setTheme(dark, .5, 2, '#00ff00')
    painter.frame++; painter.placeWake()
    assert.ok(painter.touched.length > 0)
    assert.equal(painter.theme.grid, 'rgba(128,128,128,0.5)')
    assert.equal(painter.theme.fish.at(-1), 'rgb(0,255,0)')
  }
  for (let k = 0; k < 16; k++) { whale.nodes[k * 2] = 900 - k * 40; whale.nodes[k * 2 + 1] = 400 }
  for (const dark of [false, true]) for (const [eyeColor, expected] of [['primary', null], ['black', '#000000'], ['white', '#ffffff'], ['primary', null]]) {
    painter.setTheme(dark, 0, 0, '#4d6bfe', eyeColor)
    painter.render(ocean, 1 / 60)
    const eyes = painter.touched.filter(i => painter.glyph[i] === '目')
    assert.ok(eyes.length > 0)
    assert.ok(eyes.every(i => painter.fill[i] === expected))
    assert.ok(eyes.every(i => painter.color[i] === (eyeColor === 'primary' ? '#4d6bfe' : eyeColor === 'black' ? '#ffffff' : '#181818')))
  }
  painter.setFontFamily('Custom Kanji, serif')
  assert.equal(painter.atlas.family, 'Custom Kanji, serif')
  painter.render(ocean, 1 / 60)
  assert.ok(!painter.glyph.some(g => ['鰓', '鮫', '鱶'].includes(g)))
  for (const [scale, cell] of [[.1, 4], [1, 18], [10, 180]]) {
    const p = new Painter(canvas(), scale); p.resize(1200, 800, 1)
    assert.equal(p.cellWidth, cell)
  }
})

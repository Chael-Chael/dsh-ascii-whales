import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ stdin: { contents: `export { World, SHARK_NODES } from './vendor/ascii-sharks/world.ts'; export { AsciiRenderer } from './vendor/ascii-sharks/renderer.ts'; export { Painter } from './vendor/ascii-kanji-sharks/painter.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm' })
const { World, SHARK_NODES, AsciiRenderer, Painter } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))

test('Kanji whales honor population and size, survive resizing and interaction', () => {
  for (const [count, fish, size] of [[3, 170, 1], [20, 0, .1], [1, 1000, 10]]) {
    const ocean = new World(Array.from({ length: count }, () => ({ kind: 'whale', size })), fish)
    ocean.resize(1000, 760, 18, 18)
    assert.equal(ocean.sharks.length, count)
    assert.equal(ocean.fish.length, fish)
    ocean.pointer = { x: 500, y: 300, active: true }
    ocean.splash(500, 300)
    for (let i = 0; i < 120; i++) ocean.step(1 / 60)
    ocean.resize(360, 760, 18, 18)
    for (let i = 0; i < 60; i++) ocean.step(1 / 60)
    for (const shark of ocean.sharks) assert.ok([...shark.nodes].every(Number.isFinite))
    for (const fish of ocean.fish) assert.ok([fish.x, fish.y, fish.vx, fish.vy].every(Number.isFinite))
  }
  const normal = new World([{ kind: 'whale', size: 1 }], 0), large = new World([{ kind: 'whale', size: 2 }], 0)
  normal.resize(1000, 760, 18, 18); large.resize(1000, 760, 18, 18)
  assert.equal(large.sharks[0].length, normal.sharks[0].length * 2)
})

test('Kanji whale anatomy, color, grid, wake and font controls reach the painter', async t => {
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
  const ocean = new World([{ kind: 'whale', size: 1 }], 0)
  ocean.resize(1200, 800, 18, 18)
  const whale = ocean.sharks[0]
  whale.length = 600; whale.phase = 0; whale.speed = 0; whale.turn = 0
  // Straight spine isolates silhouette classification from swimming curvature.
  for (let k = 0; k < SHARK_NODES; k++) { painter.spine[k * 2] = k * 600 / (SHARK_NODES - 1); painter.spine[k * 2 + 1] = 400; painter.arc[k] = k * 600 / (SHARK_NODES - 1) }
  painter.arcTotal = 600; painter.finLeft = painter.finRight = 600 * .32
  assert.equal(painter.classify(600 * .2, 400 + 600 * .08, 600), 1, 'Former gills are body')
  assert.equal(painter.classify(600 * .7, 400 + 600 * .07, 600), 0, 'No pelvic fins')
  assert.equal(painter.classify(600 * .97, 400 + 600 * .15, 600), 7, 'Broad whale flukes')
  assert.equal(painter.classify(600 * .33, 400 + 600 * .19, 600), 5, 'Long whale flippers')
  assert.equal(painter.classify(600 * 1.1, 400 + 600 * .1, 600), 0, 'No phantom tail beyond the spine endpoint')
  assert.equal(painter.classify(600 * .98, 400, 600), 0, 'Central tail notch stays open')
  assert.equal(painter.classify(600 * .98, 400 + 600 * .11, 600), 7, 'Curved lobe extends behind notch')
  assert.equal(painter.classify(600 * .52, 400 + 600 * .19, 600), 0, 'Old swept triangle is removed')
  assert.equal(painter.classify(600 * .338, 400 + 600 * .14, 600), 0, 'Flipper root has a slight inset')
  assert.equal(painter.classify(600 * .30, 400 + 600 * .14, 600), 5, 'Inset leaves the flipper attached')
  assert.equal(painter.classify(600 * .39, 400 + 600 * .30, 600), 5, 'Long rounded flipper tip')
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
  for (let k = 0; k < SHARK_NODES; k++) { whale.nodes[k * 2] = 900 - k * 600 / (SHARK_NODES - 1); whale.nodes[k * 2 + 1] = 400 }
  for (const dark of [false, true]) for (const [eyeColor, expected] of [['primary', null], ['black', '#000000'], ['white', '#ffffff'], ['primary', null]]) {
    painter.setTheme(dark, 0, 0, '#4d6bfe', eyeColor)
    painter.render(ocean, 1 / 60)
    const eyes = painter.touched.filter(i => painter.glyph[i] === '目')
    assert.ok(eyes.length > 0)
    assert.ok(eyes.every(i => painter.fill[i] === expected))
    assert.ok(eyes.every(i => painter.color[i] === (eyeColor === 'primary' ? '#4d6bfe' : eyeColor === 'black' ? '#ffffff' : '#181818')))
  }
  const ascii = new AsciiRenderer(canvas(), false, 1)
  ascii.resize(1200, 800, 1)
  for (const kind of ['whale', 'orca']) {
    whale.kind = kind
    ascii.rasterizeSharks([whale], 0)
    painter.buildSpine(whale)
    for (const renderer of [ascii, painter]) {
      for (let k = 0; k < SHARK_NODES; k++) {
        renderer.spine[k * 2] = k * 600 / (SHARK_NODES - 1)
        renderer.spine[k * 2 + 1] = 400
        renderer.arc[k] = k * 600 / (SHARK_NODES - 1)
      }
      renderer.arcTotal = 600
    }
    for (const [s, across, inside] of [[.98, 0, false], [.98, .11, true], [.97, -.15, true], [1.1, .1, false], [.9, .19, false]]) {
      assert.equal(ascii.sampleShark(s * 600, 400 + across * 600, 600), inside, `${kind}: ASCII curved tail ${s}/${across}`)
      assert.equal(painter.classify(s * 600, 400 + across * 600, 600), inside ? 7 : 0, `${kind}: Kanji shares the same tail`)
    }
  }
  whale.kind = 'whale'
  for (const [speed, phase, turn] of [[12, 0, 0], [60, 1.5, -1], [100, 3, 1]]) {
    Object.assign(whale, { speed, phase, turn })
    ascii.rasterizeSharks([whale], 1)
    painter.buildSpine(whale)
    assert.deepEqual([...painter.spine], [...ascii.spine], 'Kanji body wave matches stackedlol rendering')
    assert.equal(painter.finLeft, ascii.finTipLeft)
    assert.equal(painter.finRight, ascii.finTipRight)
  }
  for (const kind of ['orca', 'whale', 'orca']) for (const dark of [false, true]) {
    whale.kind = kind
    for (const mode of ['ascii', 'hanzi']) {
      const renderer = new AsciiRenderer(canvas(), dark, .6, 0, 0, mode)
      renderer.resize(1200, 800, 1)
      renderer.setTheme(dark, 0, 0, '#ec4899', false, 'black')
      renderer.render(ocean, 1 / 60)
      assert.equal([...renderer.sharkFlag].includes(7), kind === 'orca', `${mode}: white patches only on orcas`)
      assert.ok([...renderer.sharkFlag].includes(5), 'Real eyes remain distinct from patches')
      assert.equal(renderer.bodyColor(120), 'rgb(236,72,153)', 'Species preserves custom color')
      painter.buildSpine(whale)
      assert.deepEqual([...painter.spine], [...renderer.spine])
      assert.equal(painter.finLeft, renderer.finTipLeft)
    }
    painter.setTheme(dark, 0, 0, '#ec4899', 'black')
    painter.render(ocean, 1 / 60)
    assert.equal(painter.touched.some(i => painter.fill[i] === '#f5f5f0'), kind === 'orca', 'Kanji patches follow species')
    const eyes = painter.touched.filter(i => painter.glyph[i] === '目')
    assert.ok(eyes.length > 0 && eyes.every(i => painter.fill[i] === '#000000'), 'Eye override does not recolor white patches')
  }
  ocean.events.push({ kind: 'eat', x: 400, y: 400 }, { kind: 'splash', x: 700, y: 400 })
  painter.consumeEvents(ocean)
  for (const glyph of ['喰', 'ガ', 'ザ']) assert.ok(painter.fx.some(fx => fx.glyph === glyph))
  assert.equal(ocean.events.length, 0)
  ocean.fish = Array.from({ length: 5 }, (_, species) => ({ x: 100 + species * 36, y: 100, species, depth: 1, alarm: 0, alive: true }))
  painter.frame++; painter.touched.length = 0; painter.placeFish(ocean)
  assert.equal(painter.touched.length, 5)
  assert.ok(painter.touched.every(i => typeof painter.glyph[i] === 'string' && painter.glyph[i].length > 0))
  painter.bodySwing = 0; painter.buildSpine(ocean.sharks[0])
  assert.deepEqual([...painter.spine], [...ocean.sharks[0].nodes])
  painter.bodySwing = 2; painter.buildSpine(ocean.sharks[0])
  assert.ok(painter.spine.some((v, i) => Math.abs(v - ocean.sharks[0].nodes[i]) > 1))
  painter.bodySwing = 1
  painter.setFontFamily('Custom Kanji, serif')
  assert.equal(painter.atlas.family, 'Custom Kanji, serif')
  painter.render(ocean, 1 / 60)
  assert.ok(!painter.glyph.some(g => ['鰓', '鮫', '鱶'].includes(g)))
  for (const [scale, cell] of [[.1, 4], [1, 10], [10, 96]]) {
    const p = new Painter(canvas(), scale); p.resize(1200, 800, 1)
    assert.equal(p.cellWidth, cell)
  }
  for (const width of [360, 1000, 1600]) for (const scale of [.5, 1, 2]) for (const dpr of [1, 2]) {
    const a = new AsciiRenderer(canvas(), false, scale, 0, 0, 'ascii')
    const h = new AsciiRenderer(canvas(), false, scale, 0, 0, 'hanzi')
    const k = new Painter(canvas(), scale)
    for (const renderer of [a, h, k]) renderer.resize(width, 800, dpr)
    for (const renderer of [a, h, k]) {
      const initialCell = [renderer.cellWidth, renderer.cellHeight]
      renderer.resize(2400, 1200, dpr === 1 ? 2 : 1)
      assert.deepEqual([renderer.cellWidth, renderer.cellHeight], initialCell, 'Resize and DPR changes preserve CSS cell size')
    }
    assert.equal(h.cellWidth, k.cellWidth, 'Hanzi and Kanji share fixed square cells')
    assert.equal(h.cellHeight, k.cellHeight)
    const ratio = h.cellWidth * h.cellHeight / (a.cellWidth * a.cellHeight)
    assert.ok(Math.abs(ratio - 1) < .15, `Comparable grain density at ${width}px / ${scale}x / DPR ${dpr}`)
  }

})

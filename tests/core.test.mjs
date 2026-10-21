import test from 'node:test'
import assert from 'node:assert/strict'
import { defaults, ranges, normalize, readSettings, fractionalSteps, inputStep } from '../src/settings.mjs'
import { build } from 'esbuild'
const bundled = await build({ entryPoints: ['vendor/ascii-sharks/index.ts'], bundle: true, write: false, format: 'esm' })
const { World, AsciiRenderer, paintGrid } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))

test('untrusted persisted settings are bounded and recover safely', () => {
  assert.deepEqual(normalize(null), defaults)
  assert.deepEqual(normalize({ count: 100, speed: -4, size: NaN, enabled: 'false', opacity: Infinity }), { ...defaults, count: 20, speed: 0.1 })
  assert.equal(normalize({ count: 2.8 }).count, 3)
  assert.equal(normalize({ color: '#EC4899' }).color, '#ec4899')
  assert.equal(normalize({ glyphMode: 'hanzi' }).glyphMode, 'hanzi')
  for (const glyphMode of ['unknown', null, 1, {}]) assert.equal(normalize({ glyphMode }).glyphMode, 'ascii')
  assert.equal(normalize({ fontSource: 'local', hanziFont: '方正屏显雅宋简体' }).hanziFont, '方正屏显雅宋简体')
  assert.equal(normalize({ asciiFont: 'Times New Roman' }).asciiFont, 'Times New Roman')
  assert.equal(normalize({ fontSource: 'remote' }).fontSource, 'bundled')
  for (const name of ['url(https://example.com)', 'a";color:red', 'a\n', 'x'.repeat(101), 42]) assert.equal(normalize({ hanziFont: name }).hanziFont, '')
  for (const color of ['red', '#fff', '#gg0000', 'url(https://example.com)', null]) assert.equal(normalize({ color }).color, defaults.color)
  assert.deepEqual(readSettings({ getItem() { throw Error('blocked') } }), defaults)
  assert.deepEqual(readSettings({ getItem() { return '{broken' } }), defaults)
  for (const [key, [min, max]] of Object.entries(ranges)) {
    assert.equal(normalize({ [key]: min - 100 })[key], min)
    assert.equal(normalize({ [key]: max + 100 })[key], max)
    assert.equal(inputStep(key, .95), fractionalSteps.includes(key) ? .05 : ranges[key][2])
    assert.equal(inputStep(key, 1), ranges[key][2])
    assert.equal(inputStep(key, 10), ranges[key][2])
  }
})
test('cell size, hidden grid and selected color reach the upstream rasterizer', t => {
  const fills = []
  const ctx = new Proxy({ fillStyle: '', fillRect(...coordinates) { assert.ok(coordinates.every(Number.isFinite)); fills.push(this.fillStyle) } }, { get: (target, key) => target[key] ?? (() => {}) })
  const createCanvas = () => ({ getContext: () => ctx })
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: createCanvas } })
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'document', previous); else delete globalThis.document })
  paintGrid({ stroke() { assert.fail('Hidden grid must not draw') } }, 640, 480, 8, 12, 1, false, 0)
  const world = new World([{ kind: 'whale', size: 1 }], 10)
  const renderer = new AsciiRenderer(createCanvas(), false, 1.5)
  renderer.resize(1000, 760, 1)
  assert.equal(renderer.cellWidth, 12)
  world.resize(1000, 760, renderer.cellWidth, renderer.cellHeight)
  for (let i = 0; i < 120; i++) world.step(1 / 60)
  for (const [dark, color, dominant] of [[false, '#ff0000', 0], [true, '#00ff00', 1]]) {
    fills.length = 0
    renderer.setTheme(dark, .05, 1, color); renderer.render(world, 1 / 60)
    assert.ok(fills.some(fill => { const rgb = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(fill)?.slice(1).map(Number); return rgb && rgb[dominant] > rgb[(dominant + 1) % 3] + 20 }))
  }
  for (const color of ['#4d6bfe', '#ec4899', '#808080', '#000000', '#ffffff']) {
    const selected = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
    renderer.setTheme(false, 0, 0, color)
    assert.equal(renderer.bodyColor(120), `rgb(${selected.join(',')})`)
    const shades = [60, 120, 200].map(level => renderer.bodyColor(level))
    const rgb = shades.map(s => s.match(/\d+/g).map(Number))
    for (let c = 0; c < 3; c++) assert.ok(rgb[0][c] <= selected[c] && rgb[2][c] >= selected[c])
    renderer.setTheme(true, 0, 0, color)
    assert.deepEqual([60, 120, 200].map(level => renderer.bodyColor(level)), shades)
  }
  for (const glyphMode of ['ascii', 'hanzi']) for (const grid of [0.1, 10]) {
    const extremes = new AsciiRenderer(createCanvas(), false, grid, 0, 10, glyphMode)
    extremes.resize(320, 240, 1)
    assert.ok(extremes.cellWidth >= 1 && extremes.cellHeight >= 1)
    const smallWorld = new World([{ kind: 'whale', size: .1 }], 0)
    smallWorld.resize(320, 240, extremes.cellWidth, extremes.cellHeight)
    extremes.render(smallWorld, 1 / 60)
  }
})
test('Hanzi glyphs follow whale anatomy through turns and fit full-width cells', t => {
  const text = []
  const ctx = new Proxy({ fillText(glyph, x, y) { text.push({ glyph, x, y }) } }, { get: (target, key) => target[key] ?? (() => {}) })
  const createCanvas = () => ({ getContext: () => ctx })
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: createCanvas } })
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'document', previous); else delete globalThis.document })
  const renderer = new AsciiRenderer(createCanvas(), false, 1, 0, 0, 'hanzi')
  renderer.resize(1200, 1000, 1)
  const world = new World([{ kind: 'whale', size: 1 }], 0)
  world.resize(1200, 1000, renderer.cellWidth, renderer.cellHeight)
  const whale = world.sharks[0]
  whale.length = 700; whale.phase = 0; whale.turn = 0
  for (const angle of [0, Math.PI / 2, Math.PI]) {
    for (let k = 0; k < whale.nodes.length / 2; k++) {
      const along = 350 - k * 700 / (whale.nodes.length / 2 - 1)
      whale.nodes[k * 2] = 600 + Math.cos(angle) * along
      whale.nodes[k * 2 + 1] = 500 + Math.sin(angle) * along
    }
    text.length = 0
    renderer.render(world, 1 / 60)
    for (const glyph of ['吻', '目', '背', '鳍', '尾']) assert.ok(text.some(item => item.glyph === glyph), `Missing anatomical glyph ${glyph}`)
    let lastS = 0
    for (const glyph of '度求索') {
      const marks = text.filter(item => item.glyph === glyph)
      assert.equal(marks.length, 1, 'The hidden signature appears once on the lead whale')
      assert.ok(renderer.sampleShark(marks[0].x, marks[0].y - 1, whale.length))
      assert.ok(renderer.hitS > lastS && renderer.hitV > 0)
      lastS = renderer.hitS
    }
    for (const { glyph, x, y } of text) {
      if (!'吻目背鳍尾'.includes(glyph)) continue
      assert.ok(renderer.sampleShark(x, y - 1, whale.length))
      const s = renderer.hitS
      if (glyph === '吻') assert.ok(s < .1)
      if (glyph === '目') assert.equal(renderer.hitFlag, 5)
      if (glyph === '背') assert.ok(s >= .1 && s < .6)
      if (glyph === '尾') assert.ok(s >= .84)
      if (glyph === '鳍') assert.ok(s < .84 && [3, 4].includes(renderer.hitFlag))
    }
    assert.ok(parseFloat(ctx.font.split(' ')[1]) <= renderer.cellWidth)
  }
  world.sharks = []
  world.fish = [{ x: 100, y: 100, alive: true, depth: 1, turn: 0, alarm: 0 }]
  text.length = 0; renderer.render(world, 1 / 60)
  assert.ok(text.some(({ glyph }) => '鱼鲤鲭鲱'.includes(glyph)))
})
test('fish population supports zero and the configured upper bound', () => {
  for (const count of [0, 1000]) {
    const world = new World([{ kind: 'whale', size: 1 }], count)
    world.resize(640, 760, 6, 9)
    for (let i = 0; i < 60; i++) world.step(1 / 60)
    assert.equal(world.fish.length, count)
    assert.ok([...world.sharks[0].nodes].every(Number.isFinite))
  }
})
test('upstream simulation accepts whales and keeps finite bodies and fish after resize and interaction', () => {
  const world = new World([{ kind: 'whale', size: 1 }, { kind: 'whale', size: .7 }])
  world.resize(1000, 760, 8, 12)
  world.pointer = { x: 500, y: 300, active: true }
  world.splash(500, 300)
  for (let i = 0; i < 300; i++) world.step(1 / 60)
  world.resize(360, 760, 8, 12)
  for (let i = 0; i < 120; i++) world.step(1 / 60)
  assert.equal(world.sharks.length, 2)
  assert.ok(world.fish.length > 0)
  for (const whale of world.sharks) { assert.equal(whale.kind, 'whale'); assert.ok([...whale.nodes].every(Number.isFinite)) }
  for (const fish of world.fish) assert.ok([fish.x, fish.y, fish.vx, fish.vy].every(Number.isFinite))
  const extremes = new World(Array.from({ length: 20 }, (_, i) => ({ kind: 'whale', size: i % 2 ? .1 : 10 })), 1000)
  extremes.resize(1000, 760, 8, 12)
  for (let i = 0; i < 30; i++) extremes.step(1 / 60)
  assert.equal(extremes.sharks.length, 20)
  for (const whale of extremes.sharks) assert.ok([...whale.nodes].every(Number.isFinite))
})

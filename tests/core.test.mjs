import test from 'node:test'
import assert from 'node:assert/strict'
import { defaults, ranges, normalize, readSettings } from '../src/settings.mjs'
import { build } from 'esbuild'
const bundled = await build({ entryPoints: ['vendor/ascii-sharks/index.ts'], bundle: true, write: false, format: 'esm' })
const { World, AsciiRenderer, paintGrid } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))

test('untrusted persisted settings are bounded and recover safely', () => {
  assert.deepEqual(normalize(null), defaults)
  assert.deepEqual(normalize({ count: 100, speed: -4, size: NaN, enabled: 'false', opacity: Infinity }), { ...defaults, count: 6, speed: 0.2 })
  assert.equal(normalize({ count: 2.8 }).count, 3)
  assert.equal(normalize({ color: '#EC4899' }).color, '#ec4899')
  for (const color of ['red', '#fff', '#gg0000', 'url(https://example.com)', null]) assert.equal(normalize({ color }).color, defaults.color)
  assert.deepEqual(readSettings({ getItem() { throw Error('blocked') } }), defaults)
  assert.deepEqual(readSettings({ getItem() { return '{broken' } }), defaults)
  for (const [key, [min, max]] of Object.entries(ranges)) {
    assert.equal(normalize({ [key]: min - 100 })[key], min)
    assert.equal(normalize({ [key]: max + 100 })[key], max)
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
})
test('fish population supports zero and the configured upper bound', () => {
  for (const count of [0, 340]) {
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
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { build } from 'esbuild'
const bundled = await build({ entryPoints: ['src/background.mjs'], bundle: true, write: false, format: 'esm', loader: { '.woff': 'dataurl' } })
const { mountBackgrounds } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))
const engineBundle = await build({ entryPoints: ['vendor/ascii-sharks/engine.ts'], bundle: true, write: false, format: 'esm' })
const { OceanEngine } = await import('data:text/javascript;base64,' + Buffer.from(engineBundle.outputFiles[0].text).toString('base64'))
import { defaults } from '../src/settings.mjs'

test('scene follows hero, preference, visibility and disposal without duplicate canvases', async t => {
  const dom = new JSDOM('<div data-conversation-content data-content-phase="hero"><div data-conversation-scroll></div></div>', { pretendToBeVisual: true })
  const win = dom.window, frames = new Map(), observers = []
  let nextFrame = 0, settings = { ...defaults }
  const motion = new win.EventTarget(); motion.matches = false
  const context = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true } })
  win.HTMLCanvasElement.prototype.getContext = () => context
  win.matchMedia = () => motion
  const saved = new Map()
  for (const [key, value] of Object.entries({
    window: win, document: win.document, getComputedStyle: () => ({ colorScheme: 'light', position: 'static', fontFamily: 'monospace' }), devicePixelRatio: 1,
    matchMedia: () => motion, MutationObserver: win.MutationObserver,
    ResizeObserver: class { constructor(fn) { this.fn = fn; observers.push(this) } observe() { queueMicrotask(() => { if (!this.disconnected) this.fn() }) } disconnect() { this.disconnected = true } },
    IntersectionObserver: class { constructor() { observers.push(this) } observe() {} disconnect() { this.disconnected = true } },
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame }, cancelAnimationFrame: id => frames.delete(id),
  })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value }) }
  t.after(() => { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } dom.window.close() })
  for (const speed of [.1, 1, 10]) {
    const probe = win.document.createElement('canvas')
    probe.getBoundingClientRect = () => ({ width: 100, height: 100, left: 0, top: 0 })
    const engine = new OceanEngine(probe, [], speed, false, 1, 0, 0, 0)
    engine.last = 0
    for (let frame = 1; frame <= 60; frame++) {
      frames.delete(engine.raf)
      engine.frame(frame * 1000 / 60)
    }
    assert.ok(Math.abs(engine.world.time - speed) < 1 / 30, `Speed ${speed} should advance simulation proportionally`)
    engine.destroy()
  }
  const card = win.document.querySelector('[data-conversation-content]')
  Object.defineProperties(card, { clientWidth: { value: 1000 }, clientHeight: { value: 760 } })
  const scene = mountBackgrounds(() => settings)
  const settle = () => new Promise(resolve => setTimeout(resolve, 0))
  await settle()
  const canvas = card.querySelector('canvas')
  assert.ok(canvas); assert.equal(canvas.hidden, false); assert.equal(frames.size, 1)
  assert.equal(card.querySelectorAll('canvas').length, 1)
  assert.equal(card.hasAttribute('data-whales-glass'), true)
  for (const glyphMode of ['hanzi', 'ascii']) {
    settings = { ...settings, glyphMode }; scene.update(); await settle()
    assert.equal(card.querySelectorAll('canvas').length, 1)
    assert.equal(frames.size, 1, 'Character changes dispose the previous animation loop')
    assert.ok(canvas.style.fontFamily.includes(glyphMode === 'hanzi' ? 'Whales Hanzi' : 'Whales Mono'))
  }
  settings = { ...settings, fontSource: 'local', asciiFont: 'Consolas', hanziFont: '方正屏显雅宋简体' }; scene.update(); await settle()
  assert.match(canvas.style.fontFamily, /^"?Consolas"?,/)
  assert.equal(frames.size, 1)
  settings = { ...settings, glyphMode: 'hanzi' }; scene.update(); await settle()
  assert.ok(canvas.style.fontFamily.includes('方正屏显雅宋简体'))
  settings = { ...settings, hanziFont: '' }; scene.update(); await settle()
  assert.ok(canvas.style.fontFamily.startsWith('"Whales Hanzi"'))
  settings = { ...settings, glass: false }; scene.update()
  assert.equal(card.hasAttribute('data-whales-glass'), false)
  card.dataset.contentPhase = 'conversation'; await settle()
  assert.equal(canvas.hidden, true); assert.equal(frames.size, 0)
  card.dataset.contentPhase = 'hero'; await settle()
  assert.equal(canvas.hidden, false); assert.equal(frames.size, 1)
  settings = { ...settings, enabled: false }; scene.update()
  assert.equal(canvas.hidden, true); assert.equal(frames.size, 0)
  settings = { ...defaults }; scene.update()
  motion.matches = true; motion.dispatchEvent(new win.Event('change'))
  assert.equal(canvas.hidden, false); assert.equal(frames.size, 0)
  Object.defineProperty(win.document, 'hidden', { configurable: true, value: true })
  win.document.dispatchEvent(new win.Event('visibilitychange'))
  assert.equal(frames.size, 0)
  scene.dispose(); scene.dispose()
  assert.equal(card.querySelector('canvas'), null); assert.equal(frames.size, 0)
  assert.ok(observers.every(o => o.disconnected)); assert.equal(win.document.head.querySelector('style'), null)
  assert.equal(card.classList.contains('dsh-whales-scene'), false)
})

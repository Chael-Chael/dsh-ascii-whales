import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { build } from 'esbuild'
const bundled = await build({ entryPoints: ['src/background.mjs'], bundle: true, write: false, format: 'esm', loader: { '.woff': 'dataurl' } })
const { mountBackgrounds } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))
const engineBundle = await build({ entryPoints: ['vendor/ascii-sharks/engine.ts'], bundle: true, write: false, format: 'esm' })
const { OceanEngine } = await import('data:text/javascript;base64,' + Buffer.from(engineBundle.outputFiles[0].text).toString('base64'))
import { defaults } from '../src/settings.mjs'

function createSceneEnvironment(t, phase = 'hero') {
  const dom = new JSDOM(`<div data-conversation-content data-content-phase="${phase}"><div data-conversation-scroll></div></div>`, { pretendToBeVisual: true })
  const win = dom.window, frames = new Map(), observers = []
  let nextFrame = 0, colorScheme = 'light'
  const motion = new win.EventTarget(); motion.matches = false
  const context = new Proxy({ getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4) }), measureText: () => ({ actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 3 }) }, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true } })
  win.HTMLCanvasElement.prototype.getContext = () => context
  win.matchMedia = () => motion
  const listeners = []
  for (const [target, types] of [[win, ['pointermove', 'pointerdown', 'blur']], [win.document, ['visibilitychange']], [win.document.documentElement, ['pointerleave']], [motion, ['change']]]) {
    const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target)
    const tracked = new Map(types.map(type => [type, new Set()]))
    for (const [type, callbacks] of tracked) listeners.push({ type, callbacks })
    target.addEventListener = (type, callback, options) => { tracked.get(type)?.add(callback); add(type, callback, options) }
    target.removeEventListener = (type, callback, options) => { tracked.get(type)?.delete(callback); remove(type, callback, options) }
  }
  const saved = new Map(), cleanups = []
  for (const [key, value] of Object.entries({
    window: win, document: win.document, getComputedStyle: () => ({ colorScheme, position: 'static', fontFamily: 'monospace' }), devicePixelRatio: 1,
    matchMedia: () => motion, MutationObserver: win.MutationObserver,
    ResizeObserver: class { constructor(fn) { this.fn = fn; observers.push(this) } observe() { queueMicrotask(() => { if (!this.disconnected) this.fn() }) } disconnect() { this.disconnected = true } },
    IntersectionObserver: class { constructor() { observers.push(this) } observe() {} disconnect() { this.disconnected = true } },
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame }, cancelAnimationFrame: id => frames.delete(id),
  })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value }) }
  t.after(() => {
    try { for (const cleanup of cleanups.reverse()) cleanup() }
    finally {
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
      dom.window.close()
    }
  })
  const card = win.document.querySelector('[data-conversation-content]')
  Object.defineProperties(card, { clientWidth: { value: 1000 }, clientHeight: { value: 760 } })
  return {
    win, card, frames, observers, motion,
    cleanup: fn => cleanups.push(fn),
    settle: () => new Promise(resolve => setTimeout(resolve, 0)),
    assertEngineListeners(count) { for (const { type, callbacks } of listeners) assert.equal(callbacks.size, count, `${type} listener count`) },
    setTheme(value) { colorScheme = value; win.document.documentElement.setAttribute('data-ds-theme-source', value) },
  }
}

test('scene follows hero, preference, visibility and disposal without duplicate canvases', async t => {
  const { win, card, frames, observers, motion, settle, assertEngineListeners, cleanup } = createSceneEnvironment(t)
  let settings = { ...defaults, showInChat: false }
  for (const glyphMode of ['ascii', 'kanji']) for (const speed of [.1, 1, 10]) {
    const probe = win.document.createElement('canvas')
    probe.getBoundingClientRect = () => ({ width: 100, height: 100, left: 0, top: 0 })
    const engine = new OceanEngine(probe, [], speed, false, 1, 0, 0, 0, defaults.color, glyphMode)
    assert.equal(engine.world.constructor.name, 'World', 'All styles use stackedlol movement')
    engine.last = 0
    for (let frame = 1; frame <= 60; frame++) {
      frames.delete(engine.raf)
      engine.frame(frame * 1000 / 60)
    }
    assert.ok(Math.abs(engine.world.time - speed) < 1 / 30, `Speed ${speed} should advance simulation proportionally`)
    engine.destroy()
  }
  const scene = mountBackgrounds(() => settings)
  cleanup(() => scene.dispose())
  await settle()
  const canvas = card.querySelector('canvas')
  assert.ok(canvas); assert.equal(canvas.hidden, false); assert.equal(frames.size, 1)
  assert.equal(card.querySelectorAll('canvas').length, 1)
  assert.equal(card.hasAttribute('data-whales-glass'), true)
  for (const species of ['orca', 'humpback']) for (const glyphMode of ['hanzi', 'kanji', 'ascii', 'kanji', 'ascii']) {
    settings = { ...settings, species, glyphMode }; scene.update(); await settle()
    assert.equal(card.querySelectorAll('canvas').length, 1)
    assert.equal(frames.size, 1, 'Character changes dispose the previous animation loop')
    assert.ok(canvas.style.fontFamily.includes(glyphMode !== 'ascii' ? 'Whales Hanzi' : 'Whales Mono'))
  }
  settings = { ...settings, fontSource: 'local', asciiFont: 'Consolas', hanziFont: '方正屏显雅宋简体' }; scene.update(); await settle()
  assert.match(canvas.style.fontFamily, /^"?Consolas"?,/)
  assert.equal(frames.size, 1)
  settings = { ...settings, glyphMode: 'hanzi' }; scene.update(); await settle()
  assert.ok(canvas.style.fontFamily.includes('方正屏显雅宋简体'))
  settings = { ...settings, hanziFont: '' }; scene.update(); await settle()
  assert.ok(canvas.style.fontFamily.startsWith('"Whales Hanzi"'))
  settings = { ...settings, glyphMode: 'kanji', opacity: .35, blur: 24, glassOpacity: .7 }; scene.update()
  assert.equal(canvas.style.opacity, '0.35')
  assert.equal(card.style.getPropertyValue('--whales-blur'), '24px')
  assert.equal(card.style.getPropertyValue('--whales-glass-opacity'), '0.7')
  settings = { ...settings, glass: false }; scene.update()
  assert.equal(card.hasAttribute('data-whales-glass'), false)
  card.dataset.contentPhase = 'conversation'; await settle()
  assert.equal(canvas.hidden, true); assert.equal(frames.size, 0)
  card.dataset.contentPhase = 'hero'; await settle()
  assert.equal(canvas.hidden, false); assert.equal(frames.size, 1)
  settings = { ...settings, enabled: false }; scene.update()
  assert.equal(canvas.hidden, true); assert.equal(frames.size, 0)
  settings = { ...defaults, showInChat: false, glyphMode: 'kanji' }; scene.update()
  motion.matches = true; motion.dispatchEvent(new win.Event('change'))
  assert.equal(canvas.hidden, false); assert.equal(frames.size, 0)
  Object.defineProperty(win.document, 'hidden', { configurable: true, value: true })
  win.document.dispatchEvent(new win.Event('visibilitychange'))
  assert.equal(frames.size, 0)
  scene.dispose(); scene.dispose()
  assert.equal(card.querySelector('canvas'), null); assert.equal(frames.size, 0)
  assert.ok(observers.every(o => o.disconnected)); assert.equal(win.document.head.querySelector('style'), null)
  assert.equal(card.classList.contains('dsh-whales-scene'), false)
  assertEngineListeners(0)
})

test('chat mist follows explicit preferences and reuses the hero animation until disposal', async t => {
  const { win, card, frames, observers, settle, assertEngineListeners, setTheme, cleanup } = createSceneEnvironment(t, 'conversation')
  let settings = { ...defaults, enabled: true, showInChat: true, glass: true, chatGlass: true }
  const scene = mountBackgrounds(() => settings)
  cleanup(() => scene.dispose())
  await settle()

  const canvas = card.querySelector('canvas'), mist = card.querySelector('.dsh-whales-chat-mist')
  const assertLayers = (active, chat, glass = settings.glass, chatGlass = settings.chatGlass) => {
    assert.equal(card.querySelectorAll('canvas').length, 1)
    assert.equal(card.querySelectorAll('.dsh-whales-chat-mist').length, 1)
    assert.equal(canvas.hidden, !active)
    assert.equal(mist.hidden, !(active && chat && chatGlass))
    assert.equal(win.getComputedStyle(mist).display === 'none', !(active && chat && chatGlass))
    assert.equal(card.hasAttribute('data-whales-chat'), active && chat)
    assert.equal(card.hasAttribute('data-whales-chat-glass'), active && chat && chatGlass)
    assert.equal(card.hasAttribute('data-whales-glass'), active && glass)
    assert.equal(frames.size, active ? 1 : 0)
    assertEngineListeners(active ? 1 : 0)
  }
  assert.ok(canvas); assert.ok(mist)
  assert.equal(canvas.getAttribute('aria-hidden'), 'true')
  assert.equal(mist.getAttribute('aria-hidden'), 'true')
  assert.equal(canvas.style.pointerEvents, 'none')
  assertLayers(true, true)

  const style = win.document.head.querySelector('style')
  assert.match(style.textContent, /\.dsh-whales-chat-mist\b[^{}]*\{[^{}]*pointer-events\s*:\s*none/)
  const mistRules = [...style.sheet.cssRules].filter(rule => rule.selectorText?.includes('.dsh-whales-chat-mist'))
  const background = rule => rule.style.getPropertyValue('background') || rule.style.getPropertyValue('background-color')
  const lightRule = mistRules.find(rule => !rule.selectorText.includes('[data-whales-dark]') && background(rule))
  const darkRule = mistRules.find(rule => rule.selectorText.includes('[data-whales-dark]') && background(rule))
  assert.ok(lightRule, 'The injected stylesheet includes a light chat mist background')
  assert.ok(darkRule, 'The injected stylesheet includes a dark chat mist background')
  assert.notEqual(background(lightRule), background(darkRule))
  // Dark mist matches the neutral composer glass: no channel may tint the ocean.
  for (const [, r, g, b] of darkRule.cssText.matchAll(/rgba\((\d+),\s*(\d+),\s*(\d+)/g)) assert.ok(r === g && g === b, `dark mist rgba(${r},${g},${b}) must be neutral`)
  assert.match(lightRule.style.getPropertyValue('backdrop-filter'), /^blur\(/)

  const [frameId, animation] = [...frames][0], observerCount = observers.length
  const assertSameAnimation = () => {
    assert.equal(frames.get(frameId), animation, 'Phase and glass changes keep the current engine and animation')
    assert.equal(observers.length, observerCount, 'Phase changes do not construct another engine')
    assert.equal(card.querySelector('canvas'), canvas)
    assert.equal(card.querySelector('.dsh-whales-chat-mist'), mist)
  }
  for (const phase of ['hero', 'conversation', 'hero', 'conversation']) {
    card.dataset.contentPhase = phase; await settle()
    scene.update(); scene.update()
    assertLayers(true, phase !== 'hero')
    assertSameAnimation()
  }
  for (const theme of ['dark', 'light']) {
    setTheme(theme); await settle()
    assert.equal(card.hasAttribute('data-whales-dark'), theme === 'dark')
    assertLayers(true, true)
    assertSameAnimation()
  }
  // Composer and background glass switch independently.
  for (const [glass, chatGlass] of [[false, true], [true, false], [false, false], [true, true]]) {
    settings = { ...settings, glass, chatGlass }; scene.update()
    assertLayers(true, true)
    assertSameAnimation()
  }
  settings = { ...settings, blur: 8, glassOpacity: .2, chatBlur: 30, chatGlassOpacity: .8 }; scene.update()
  assert.equal(card.style.getPropertyValue('--whales-blur'), '8px')
  assert.equal(card.style.getPropertyValue('--whales-glass-opacity'), '0.2')
  assert.equal(card.style.getPropertyValue('--whales-chat-blur'), '30px')
  assert.equal(card.style.getPropertyValue('--whales-chat-glass-opacity'), '0.8')
  assert.match(lightRule.style.getPropertyValue('backdrop-filter'), /var\(--whales-chat-blur\)/)
  assertSameAnimation()

  settings = { ...settings, showInChat: false }; scene.update()
  assertLayers(false, false)
  card.dataset.contentPhase = 'hero'; await settle()
  assertLayers(true, false)
  card.dataset.contentPhase = 'conversation'; await settle()
  assertLayers(false, false)
  settings = { ...settings, showInChat: true }; scene.update()
  assertLayers(true, true)
  settings = { ...settings, enabled: false }; scene.update()
  for (const phase of ['hero', 'conversation']) {
    card.dataset.contentPhase = phase; await settle()
    assertLayers(false, false)
  }
  settings = { ...settings, enabled: true }; scene.update()
  assertLayers(true, true)
  setTheme('dark'); await settle()
  assert.equal(card.hasAttribute('data-whales-dark'), true)

  const assertDisposed = () => {
    assert.equal(card.querySelector('canvas'), null)
    assert.equal(card.querySelector('.dsh-whales-chat-mist'), null)
    assert.equal(card.classList.contains('dsh-whales-scene'), false)
    for (const attribute of ['data-whales-chat', 'data-whales-chat-glass', 'data-whales-glass', 'data-whales-dark']) assert.equal(card.hasAttribute(attribute), false)
    for (const property of ['--whales-blur', '--whales-glass-opacity', '--whales-chat-blur', '--whales-chat-glass-opacity']) assert.equal(card.style.getPropertyValue(property), '')
    assert.equal(card.style.position, '')
    assert.equal(win.document.head.querySelector('style'), null)
    assert.equal(frames.size, 0)
    assert.ok(observers.every(observer => observer.disconnected))
    assertEngineListeners(0)
  }
  scene.dispose(); scene.dispose()
  assertDisposed()
  card.dataset.contentPhase = 'hero'
  setTheme('light'); await settle()
  assertDisposed()

  card.dataset.contentPhase = 'conversation'
  const remounted = mountBackgrounds(() => settings)
  cleanup(() => remounted.dispose())
  await settle()
  assert.equal(card.querySelectorAll('canvas').length, 1)
  assert.equal(card.querySelectorAll('.dsh-whales-chat-mist').length, 1)
  assert.notEqual(card.querySelector('canvas'), canvas)
  assert.notEqual(card.querySelector('.dsh-whales-chat-mist'), mist)
  assert.equal(card.querySelector('canvas').hidden, false)
  assert.equal(card.querySelector('.dsh-whales-chat-mist').hidden, false)
  assert.equal(card.hasAttribute('data-whales-chat'), true)
  assert.equal(card.hasAttribute('data-whales-glass'), true)
  assert.equal(card.hasAttribute('data-whales-dark'), false)
  assert.equal(win.document.head.querySelectorAll('style').length, 1)
  assert.equal(frames.size, 1)
  assertEngineListeners(1)
  remounted.dispose(); remounted.dispose()
  assertDisposed()
})

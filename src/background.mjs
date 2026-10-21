import { OceanEngine } from '../vendor/ascii-sharks/engine.ts'
import monoFont from '../assets/fonts/whales-mono.woff'
import hanziFont from '../assets/fonts/whales-serif.woff'

const styles = `
@font-face{font-family:"Whales Mono";src:url("${monoFont}") format("woff");font-style:normal;font-weight:600;font-display:swap}
@font-face{font-family:"Whales Hanzi";src:url("${hanziFont}") format("woff");font-style:normal;font-weight:400;font-display:swap}
.dsh-whales-scene > [data-conversation-scroll]{position:relative;z-index:1}
.dsh-whales-scene[data-whales-glass] [data-composer-card]{
  isolation:isolate;background:transparent;--dsw-specific-input-major:transparent;
  border-color:rgba(128,128,128,.20);box-shadow:0 12px 36px #0000000d,inset 0 1px 0 #ffffff80;
}
/* The filter lives on a pseudo-element so inline fixed menus retain their viewport anchor. */
.dsh-whales-scene[data-whales-glass] [data-composer-card]::before{
  content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;
  background:rgba(255,255,255,var(--whales-glass-opacity));backdrop-filter:blur(var(--whales-blur));
  -webkit-backdrop-filter:blur(var(--whales-blur));
}
.dsh-whales-scene[data-whales-dark][data-whales-glass] [data-composer-card]::before{background:rgba(24,24,24,var(--whales-glass-opacity))}
.dsh-whales-scene[data-whales-dark][data-whales-glass] [data-composer-card]{border-color:#ffffff30;box-shadow:0 12px 36px #0003,inset 0 1px 0 #ffffff12}
@supports not (backdrop-filter:blur(1px)){
  .dsh-whales-scene[data-whales-glass] [data-composer-card]::before{background:rgba(255,255,255,.92)}
  .dsh-whales-scene[data-whales-dark][data-whales-glass] [data-composer-card]::before{background:rgba(24,24,24,.92)}
}`

export function mountBackgrounds(getSettings) {
  const mounted = new Map()
  let disposed = false, queued = false
  // shortcut: DSH has no ambient hero slot; replace this scoped adapter when one is public.
  function attach(scene) {
    const canvas = document.createElement('canvas')
    canvas.className = 'dsh-whales-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;'
    const position = scene.style.position
    if (getComputedStyle(scene).position === 'static') scene.style.position = 'relative'
    scene.prepend(canvas); scene.classList.add('dsh-whales-scene')
    let engine, population = '', appearance = ''
    function update() {
      const settings = getSettings()
      const active = settings.enabled && scene.dataset.contentPhase === 'hero'
      const dark = getComputedStyle(scene).colorScheme.includes('dark')
      canvas.hidden = !active; canvas.style.opacity = String(settings.opacity)
      const hanzi = settings.glyphMode === 'hanzi'
      const localFont = settings.fontSource === 'local' ? (hanzi ? settings.hanziFont : settings.asciiFont).trim() : ''
      const fallback = hanzi ? '"Whales Hanzi", serif' : '"Whales Mono", monospace'
      const fontFamily = localFont ? `${JSON.stringify(localFont)}, ${fallback}` : fallback
      canvas.style.fontFamily = fontFamily; canvas.style.fontWeight = hanzi ? '400' : '600'
      scene.toggleAttribute('data-whales-glass', active && settings.glass)
      scene.toggleAttribute('data-whales-dark', dark)
      scene.style.setProperty('--whales-blur', `${settings.blur}px`)
      scene.style.setProperty('--whales-glass-opacity', String(settings.glassOpacity))
      const nextPopulation = `${settings.count}/${settings.size}/${settings.gridScale}/${settings.fishCount}/${settings.glyphMode}/${fontFamily}`
      const nextAppearance = `${settings.speed}/${dark}/${settings.gridOpacity}/${settings.wake}/${settings.color}`
      if (engine && (!active || nextPopulation !== population)) { engine.destroy(); engine = undefined }
      if (!active) return
      if (!engine) {
        const whales = Array.from({ length: settings.count }, (_, i) => ({ kind: 'whale', size: settings.size * [1, .7, .84, .77, .65, .9][i % 6] }))
        engine = new OceanEngine(canvas, whales, settings.speed, dark, settings.gridScale, settings.gridOpacity, settings.fishCount, settings.wake, settings.color, settings.glyphMode)
        population = nextPopulation; appearance = nextAppearance
      } else if (appearance !== nextAppearance) {
        engine.setAppearance(settings.speed, dark, settings.gridOpacity, settings.wake, settings.color); appearance = nextAppearance
      }
    }
    const changes = new MutationObserver(update)
    changes.observe(scene, { attributes: true, attributeFilter: ['data-content-phase'] })
    mounted.set(scene, { update, dispose() {
      engine?.destroy(); changes.disconnect(); canvas.remove()
      scene.style.position = position; scene.style.removeProperty('--whales-blur')
      scene.style.removeProperty('--whales-glass-opacity')
      scene.classList.remove('dsh-whales-scene'); scene.removeAttribute('data-whales-glass'); scene.removeAttribute('data-whales-dark')
    } })
    update()
  }
  function scan() {
    queued = false
    if (disposed) return
    for (const [scene, entry] of mounted) if (!scene.isConnected) { entry.dispose(); mounted.delete(scene) }
    for (const scene of document.querySelectorAll('[data-conversation-content]')) if (!mounted.has(scene)) attach(scene)
  }
  const observer = new MutationObserver(() => { if (!queued) { queued = true; queueMicrotask(scan) } })
  observer.observe(document.body, { childList: true, subtree: true })
  const theme = new MutationObserver(() => { for (const entry of mounted.values()) entry.update() })
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-ds-theme-source'] })
  const style = document.createElement('style'); style.textContent = styles; document.head.append(style)
  scan()
  return {
    update() { for (const entry of mounted.values()) entry.update() },
    dispose() { disposed = true; observer.disconnect(); theme.disconnect(); for (const entry of mounted.values()) entry.dispose(); mounted.clear(); style.remove() },
  }
}

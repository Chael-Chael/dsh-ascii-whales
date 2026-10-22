import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url = process.env.DSH_TEST_URL || JSON.parse(readFileSync(process.env.DSH_INSTANCE_FILE, 'utf8')).url
assert.equal(new URL(url).hostname, '127.0.0.1', 'Use an isolated local DSH instance')
const record = process.argv.includes('--record')
const output = resolve(record ? 'docs/media' : '.local/qa')
const rawDir = resolve('.local/recordings')
mkdirSync(output, { recursive: true }); mkdirSync(rawDir, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: !process.env.DSH_HEADED })
const errors = [], results = []
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', colorScheme: 'light',
  ...(record ? { recordVideo: { dir: rawDir, size: { width: 1280, height: 800 } } } : {}) })
const page = await context.newPage()
if (record) {
  const cdp = await context.newCDPSession(page)
  const { targetInfo } = await cdp.send('Target.getTargetInfo')
  await cdp.send('Browser.grantPermissions', { permissions: ['localFonts'], origin: new URL(url).origin, browserContextId: targetInfo.browserContextId })
}
page.on('pageerror', error => errors.push(error.message))
page.setDefaultTimeout(15000)
const epoch = Date.now(), scenes = []
const canvas = page.locator('.dsh-whales-canvas')
const editor = page.locator('[data-composer-input]')
const pause = ms => page.waitForTimeout(ms)
async function click(locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox(); assert.ok(box)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 })
  await locator.click(); await pause(200)
}
async function openSettings() {
  if (await page.getByRole('dialog', { name: '设置', exact: true }).isVisible()) return
  const account = page.getByRole('button', { name: '账号菜单', exact: true })
  if (await account.count()) { await click(account); await click(page.getByRole('menuitem', { name: '设置', exact: true })) }
  else await click(page.getByRole('button', { name: '设置', exact: true }))
}
async function section(name) { await openSettings(); await click(page.getByRole('button', { name, exact: true })) }
async function closeSettings() {
  const dialog = page.getByRole('dialog', { name: '设置', exact: true })
  await click(dialog.getByRole('button', { name: '关闭', exact: true }))
  await dialog.waitFor({ state: 'hidden' })
}
async function theme(name) {
  await section('通用设置'); await click(page.getByRole('button', { name, exact: true })); await closeSettings()
  await pause(350)
}
async function frame() { return canvas.evaluate(c => c.toDataURL()) }
async function hint(text) {
  if (record) await page.evaluate(text => {
    const key = document.getElementById('demo-key'); key.textContent = text; key.style.display = ''
    clearTimeout(window.demoHintTimer); window.demoHintTimer = setTimeout(() => { key.style.display = 'none' }, 2500)
  }, text)
}
async function screenshot(name) {
  if (record) await page.evaluate(() => { document.getElementById('demo-key').style.display = 'none' })
  await page.screenshot({ path: join(output, name + '.png') })
}
try {
  await page.goto(url)
  const welcome = page.getByRole('dialog', { name: '开始使用', exact: true })
  await welcome.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {})
  if (await welcome.isVisible()) await welcome.getByRole('button', { name: '关闭', exact: true }).click()
  await editor.waitFor()
  await canvas.waitFor({ state: 'attached' })
  assert.equal(await editor.innerText(), '', 'Begin with an empty test draft')
  if (record) {
    if (process.env.DSH_DEMO_FONT) {
      const font = readFileSync(process.env.DSH_DEMO_FONT).toString('base64')
      await page.addStyleTag({ content: `@font-face{font-family:DemoSourceHan;src:url(data:font/otf;base64,${font})}body,button,input,[contenteditable]{font-family:DemoSourceHan,sans-serif!important}` })
    }
    await page.addStyleTag({ content: '#demo-key{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 22px;border:1px solid #4d6bfe30;border-radius:12px;background:#fff;color:#3355d9;font:18px DemoSourceHan,sans-serif;z-index:99999;pointer-events:none;box-shadow:0 4px 20px #0001}#demo-pointer{position:fixed;width:22px;height:28px;z-index:99999;pointer-events:none}.demo-ring{position:fixed;width:30px;height:30px;margin:-15px;border:2px solid #4d6bfe;border-radius:50%;z-index:99998;pointer-events:none;animation:whale-click .5s forwards}@keyframes whale-click{to{transform:scale(1.7);opacity:0}}' })
    await page.evaluate(() => {
      const key = document.createElement('div'); key.id = 'demo-key'; document.body.append(key)
      const pointer = document.createElement('div'); pointer.id = 'demo-pointer'
      pointer.innerHTML = '<svg viewBox="0 0 24 30"><path d="M2 2v23l6-6 5 10 4-2-5-10h9z" fill="#4d6bfe" stroke="white" stroke-width="2"/></svg>'
      document.body.append(pointer)
      window.addEventListener('mousemove', e => { pointer.style.left = e.clientX + 'px'; pointer.style.top = e.clientY + 'px' })
      window.addEventListener('mousedown', e => { const ring = document.createElement('div'); ring.className = 'demo-ring'; ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; document.body.append(ring); setTimeout(() => ring.remove(), 550) })
    })
  }
  const themeScenes = [['ascii', 'light', '浅色'], ['ascii', 'dark', '深色'], ...(record ? [['hanzi', 'hanzi-light', '浅色'], ['hanzi', 'hanzi-dark', '深色']] : [])]
  for (const [mode, id, name] of themeScenes) {
    await theme(name)
    if (record) {
      await section('ASCII 鲸鱼')
      await click(page.getByRole('button', { name: mode === 'hanzi' ? '汉字' : 'ASCII', exact: true }))
      const grid = page.getByRole('spinbutton', { name: '字符栅格（倍）', exact: true })
      await grid.fill(mode === 'hanzi' ? '0.8' : '1'); await grid.press('Tab')
      assert.equal(await grid.inputValue(), mode === 'hanzi' ? '0.8' : '1')
      await click(page.getByRole('switch', { name: '显示海洋' }))
      await click(page.getByRole('switch', { name: '显示海洋' }))
      await closeSettings()
    }
    assert.equal(await page.locator('html').evaluate(e => getComputedStyle(e).colorScheme), name === '浅色' ? 'light' : 'dark')
    assert.equal(await canvas.isVisible(), true)
    assert.equal(await canvas.evaluate(e => getComputedStyle(e).opacity), '1', 'Default opacity preserves the selected body color')
    assert.equal(await canvas.evaluate(e => getComputedStyle(e).pointerEvents), 'none')
    const glass = await page.locator('[data-composer-card]').evaluate(e => {
      const style = getComputedStyle(e, '::before')
      return { color: style.backgroundColor, filter: style.backdropFilter }
    })
    assert.equal(glass.filter, 'blur(14px)')
    const rgb = glass.color.match(/[\d.]+/g).slice(0, 3)
    assert.equal(new Set(rgb).size, 1, 'Glass tint is neutral in both themes')
    const box = await canvas.boundingBox(); assert.ok(box.width > 900 && box.height > 650)
    assert.notEqual(await frame(), await pause(300).then(frame), 'Whales animate')
    const start = (Date.now() - epoch) / 1000
    await hint(`${mode === 'hanzi' ? '汉字' : 'ASCII'} · ${name} · 鲸群游过留白`)
    await page.mouse.move(1180, 760, { steps: 12 })
    await pause(record ? 2000 : 200)
    await screenshot(id)
    if (record) await pause(5000)
    scenes.push({ id, glyphMode: mode, gridScale: mode === 'hanzi' ? .8 : 1, start, duration: (Date.now() - epoch) / 1000 - start })
    results.push(id + ': background, animation, native theme, input click-through PASS')
  }
  await section('ASCII 鲸鱼')
  if (record) {
    await click(page.getByRole('button', { name: '恢复默认', exact: true }))
    await click(page.getByRole('button', { name: 'ASCII', exact: true }))
  }
  if (!record) {
    await click(page.getByRole('switch', { name: '显示海洋' }))
    for (const label of ['游动速度', '鲸鱼大小', '字符栅格（倍）', '尾迹强度']) {
      const input = page.getByRole('spinbutton', { name: label, exact: true })
      await input.fill('1')
      for (const [key, expected] of [['ArrowDown', '0.95'], ['ArrowDown', '0.9'], ['ArrowUp', '0.95'], ['ArrowUp', '1'], ['ArrowUp', '1.1'], ['ArrowDown', '1']]) {
        await input.press(key); assert.equal(await input.inputValue(), expected, `${label} ${key}`)
      }
      await input.fill('0.9'); assert.equal(await input.inputValue(), '0.9', 'Typing does not get mistaken for stepping')
      await input.fill('1'); await input.scrollIntoViewIfNeeded()
      const box = await input.boundingBox()
      await page.mouse.click(box.x + box.width - 10, box.y + box.height * .65)
      assert.equal(await input.inputValue(), '0.95', `${label} native down spinner`)
      const min = label === '尾迹强度' ? '0' : '0.1'
      await input.fill(min); await input.press('ArrowDown'); assert.equal(await input.inputValue(), min)
      await input.press('ArrowUp'); assert.equal(await input.inputValue(), label === '尾迹强度' ? '0.05' : '0.15')
      await input.fill('10'); await input.press('ArrowUp'); assert.equal(await input.inputValue(), '10')
      await input.press('ArrowDown'); assert.equal(await input.inputValue(), '9.9')
      await input.fill('1')
    }
    await click(page.getByRole('switch', { name: '显示海洋' }))
    results.push('size, grid, speed and wake: 0.05/0.1 steps, 1 boundary, native spinner, manual typing and bounds PASS')
  }
  const start = (Date.now() - epoch) / 1000
  await hint('官方设置控件 · 鲸鱼动画与中性毛玻璃')
  const changes = [['鲸鱼数量', '2'], ['游动速度', '0.7'], ['鲸鱼大小', '0.8'], ['透明度', '0.6'], ['字符栅格（倍）', '1.5'], ['底纹网格透明度', '0'], ['小鱼数量', '80'], ['尾迹强度', '2'], ['玻璃模糊（px）', '20'], ['玻璃不透明度', '0.3']]
  for (const [label, value] of changes) {
    const input = page.getByRole('spinbutton', { name: label, exact: true })
    await click(input); await input.fill(value); await input.press('Tab')
    assert.equal(await input.inputValue(), value)
  }
  const reset = page.getByRole('button', { name: '恢复默认' })
  assert.ok(Number((await reset.evaluate(e => getComputedStyle(e).backgroundColor)).match(/\d+/)[0]) > 200, 'Official primary reset is light in dark mode')
  const colorPicker = page.locator('input[type=color][aria-label="海洋颜色"]')
  await click(page.getByRole('button', { name: '玫瑰粉', exact: true }))
  assert.equal(await colorPicker.inputValue(), '#ec4899')
  const settingsMode = record ? 'ASCII' : '汉字'
  await click(page.getByRole('button', { name: settingsMode, exact: true }))
  assert.equal(await page.getByRole('button', { name: settingsMode, exact: true }).getAttribute('aria-pressed'), 'true')
  await colorPicker.fill('#ec4899')
  assert.equal(await colorPicker.inputValue(), '#ec4899')
  await screenshot('settings-dark')
  if (record) await pause(2500)
  await closeSettings(); await pause(record ? 2500 : 100)
  scenes.push({ id: 'settings', glyphMode: record ? 'ascii' : 'hanzi', start, duration: (Date.now() - epoch) / 1000 - start })
  if (record) {
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: '恢复默认', exact: true }))
    assert.equal(await page.getByRole('button', { name: 'ASCII', exact: true }).getAttribute('aria-pressed'), 'true')
    const start = (Date.now() - epoch) / 1000
    await hint('内置双语字体 · 也可扫描并选择本机字体')
    await click(page.getByRole('button', { name: '本机自定义', exact: true }))
    await click(page.getByRole('button', { name: '扫描本机字体', exact: true }))
    await page.getByRole('button', { name: '选择英文字体', exact: true }).waitFor()
    await click(page.getByRole('button', { name: '选择英文字体', exact: true }))
    await click(page.getByRole('menuitem', { name: 'Consolas', exact: true }))
    await click(page.getByRole('button', { name: '选择中文字体', exact: true }))
    await click(page.getByRole('menuitem', { name: 'SimSun', exact: true }))
    await screenshot('fonts-dark'); await pause(1500)
    await click(page.getByRole('button', { name: '内置默认', exact: true })); await closeSettings(); await pause(1500)
    scenes.push({ id: 'fonts', glyphMode: 'ascii', gridScale: 1, start, duration: (Date.now() - epoch) / 1000 - start })
  }
  if (!record) {
    await page.reload(); await canvas.waitFor({ state: 'visible' })
    await section('ASCII 鲸鱼')
    for (const [label, value] of changes) assert.equal(await page.getByRole('spinbutton', { name: label, exact: true }).inputValue(), value)
    assert.equal(await colorPicker.inputValue(), '#ec4899')
    assert.equal(await page.getByRole('button', { name: '汉字', exact: true }).getAttribute('aria-pressed'), 'true', 'Hanzi selection persists')
    await click(page.getByRole('switch', { name: '毛玻璃输入框' }))
    assert.equal(await page.locator('[data-whales-glass]').count(), 0)
    await click(page.getByRole('switch', { name: '毛玻璃输入框' }))
    assert.equal(await page.locator('[data-composer-card]').evaluate(e => getComputedStyle(e, '::before').backdropFilter), 'blur(20px)')
    await click(page.getByRole('switch', { name: '显示海洋' })); assert.equal(await canvas.isVisible(), false)
    await closeSettings(); await page.reload(); await editor.waitFor(); assert.equal(await canvas.isVisible(), false)
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: '恢复默认' })); await closeSettings()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dsh-ascii-whales:v1')).color), '#4d6bfe')
    assert.equal(await canvas.isVisible(), true)
    await section('ASCII 鲸鱼')
    assert.equal(await page.getByRole('button', { name: 'ASCII', exact: true }).getAttribute('aria-pressed'), 'true', 'Reset restores ASCII')
    await click(page.getByRole('button', { name: '汉字', exact: true })); await closeSettings()
    for (const [id, label] of [['light', '浅色'], ['dark', '深色']]) {
      await theme(label)
      assert.equal(await canvas.count(), 1)
      assert.notEqual(await frame(), await pause(300).then(frame), 'Hanzi animate in both themes')
      await page.locator('[data-conversation-content]').screenshot({ path: join(output, `hanzi-${id}.png`) })
    }
    results.push('Hanzi selection, reload persistence, reset, both themes and animation PASS')
    const fontFaces = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].filter(f => f.family.startsWith('Whales')).map(f => ({ family: f.family, status: f.status }))
    })
    for (const family of ['Whales Mono', 'Whales Hanzi']) assert.ok(fontFaces.some(f => f.family === family && f.status === 'loaded'), `${family} must load from the package`)
    assert.match(await canvas.evaluate(c => c.getContext('2d').font), /Whales Hanzi/)
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: '本机自定义', exact: true }))
    await page.getByRole('textbox', { name: '英文字体名称', exact: true }).fill('Consolas')
    await page.getByRole('textbox', { name: '中文字体名称', exact: true }).fill('方正屏显雅宋简体')
    await closeSettings(); await page.reload(); await canvas.waitFor({ state: 'visible' })
    await section('ASCII 鲸鱼')
    assert.equal(await page.getByRole('textbox', { name: '英文字体名称', exact: true }).inputValue(), 'Consolas')
    assert.equal(await page.getByRole('textbox', { name: '中文字体名称', exact: true }).inputValue(), '方正屏显雅宋简体')
    await closeSettings(); await pause(200)
    assert.match(await canvas.evaluate(c => c.getContext('2d').font), /方正屏显雅宋简体/)
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: 'ASCII', exact: true })); await closeSettings(); await pause(200)
    assert.match(await canvas.evaluate(c => c.getContext('2d').font), /Consolas/)
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: '汉字', exact: true }))
    await page.getByRole('textbox', { name: '中文字体名称', exact: true }).fill('')
    await closeSettings(); await pause(200)
    assert.match(await canvas.evaluate(c => c.getContext('2d').font), /^[^,]+Whales Hanzi/)
    await section('ASCII 鲸鱼'); await click(page.getByRole('button', { name: '内置默认', exact: true })); await closeSettings()
    results.push('bundled offline fonts loaded, separate local fonts, reload persistence, blank fallback PASS')
    await editor.fill('只测试输入，不发送'); assert.equal(await editor.innerText(), '只测试输入，不发送')
    assert.equal(await canvas.isVisible(), true, 'Background remains behind the draft')
    await editor.fill('')
    await click(page.getByRole('button', { name: /^选择模型/ }))
    const menu = page.getByRole('menu').last()
    const menuBox = await menu.boundingBox(), composerBox = await page.locator('[data-composer-card]').boundingBox()
    assert.ok(menuBox && menuBox.x > composerBox.x && menuBox.x + menuBox.width <= 1280 && menuBox.y >= 0 && menuBox.y + menuBox.height <= composerBox.y + composerBox.height)
    await page.keyboard.press('Escape')
    const history = page.getByRole('treeitem').filter({ hasText: /^@Codex/ }).first()
    assert.ok(await history.count(), 'Existing chat fixture required for lifecycle check')
    {
      await click(history); await pause(500); assert.equal(await canvas.isVisible(), false, 'Existing conversation is undecorated')
      await click(page.getByRole('button', { name: /^(新会话|新建会话)$/, exact: true }).first()); await canvas.waitFor({ state: 'visible' })
      assert.equal(await canvas.count(), 1)
      results.push('existing chat → new chat lifecycle PASS')
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await pause(200)
    const still = await frame(); await pause(400); assert.equal(await frame(), still, 'Reduced motion is static')
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await pause(200)
    assert.notEqual(await frame(), await pause(300).then(frame))
    await page.setViewportSize({ width: 640, height: 800 }); await pause(300)
    assert.equal(await canvas.count(), 1); assert.equal(await canvas.isVisible(), true)
    assert.ok(await canvas.evaluate(c => c.width > 0 && c.width < 650))
    await screenshot('narrow'); await page.setViewportSize({ width: 1280, height: 800 })
    results.push('all settings, persistence, neutral glass, official primary reset, menu position, disable, reset, draft editing, reduced motion, resize PASS')
  }
  await theme('浅色'); await section('ASCII 鲸鱼')
  await click(page.getByRole('button', { name: '恢复默认' })); await screenshot('settings-light'); await closeSettings()
  await theme('跟随系统')
  assert.deepEqual(errors, [])
  results.push('browser page errors: 0')
  const raw = record ? await page.video().path() : null
  await context.close()
  if (record) {
    writeFileSync(join(rawDir, 'capture.json'), JSON.stringify({ raw, scenes, results }, null, 2) + '\n')
    for (const scene of scenes) {
      const mp4 = join(rawDir, scene.id + '.mp4'), gif = join(rawDir, scene.id + '.gif')
      execFileSync('ffmpeg', ['-y', '-ss', String(scene.start), '-i', raw, '-t', String(scene.duration), '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', mp4], { stdio: 'pipe' })
      execFileSync('ffmpeg', ['-y', '-i', mp4, '-filter_complex', 'fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', gif], { stdio: 'pipe' })
      const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', gif], { encoding: 'utf8' }))
      assert.equal(probe.streams[0].width, 960); assert.ok(Number(probe.format.duration) > 5)
      copyFileSync(gif, join(output, scene.id + '.gif'))
    }
    writeFileSync(join(output, 'manifest.json'), JSON.stringify({ viewport: [1280, 800], gif: [960, 600], fps: 15, scenes, results }, null, 2) + '\n')
  }
  writeFileSync(join(output, 'checks.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(results.join('\n'))
} catch (error) {
  if (!page.isClosed()) await page.screenshot({ path: join(output, 'failure.png') })
  throw error
} finally { await browser.close() }

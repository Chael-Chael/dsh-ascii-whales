import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { Button, Input, Switch, Menu, IconChevronDownOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { useState } from 'react'
import { defaults, normalize, ranges, readSettings, storageKey, fractionalSteps, inputStep } from './settings.mjs'
import { mountBackgrounds } from './background.mjs'

const en = {
  title: 'ASCII Whales', description: 'Let whales drift through the quiet, and thoughts rise to the surface.',
  enabled: 'Show whales', count: 'Whale count', speed: 'Swimming speed', size: 'Whale size', opacity: 'Opacity',
  glass: 'Frosted-glass composer', blur: 'Glass blur (px)',
  gridScale: 'Cell size (×)', gridOpacity: 'Grid opacity', glassOpacity: 'Glass opacity',
  fishCount: 'Small fish count', wake: 'Wake intensity', color: 'Whale color',
  glyphMode: 'Character style', ascii: 'ASCII', hanzi: 'Hanzi',
  fontSource: 'Font', bundled: 'Bundled default', local: 'Local custom', asciiFont: 'English font name', hanziFont: 'Chinese font name',
  fontHint: 'Defaults: Geist Mono 600 / Source Han Serif. Local names use fonts installed on this device; blank or unavailable names fall back to the bundled font.',
  scanFonts: 'Scan local fonts', scanning: 'Scanning…', chooseAscii: 'Choose English font', chooseHanzi: 'Choose Chinese font',
  fontUnsupported: 'This browser cannot list local fonts. You can still type an installed font name.', fontDenied: 'Font access was not granted. Allow it in browser permissions or enter a name manually.', fontScanFailed: 'Could not scan fonts. Try again or enter a name manually.', fontScanDone: 'Font families found:',
  blue: 'DeepSeek blue', cyan: 'Cyan', purple: 'Violet', pink: 'Rose', orange: 'Amber', green: 'Mint',
  note: 'Let the sea take shape in letters or Hanzi: 目 for eyes, 鳍 for fins, 尾 for tails. Choose a color for whales, fish and wakes. Set grid, fish or wake to 0 to hide them. Saved in this browser; reduced motion is respected.',
  reset: 'Restore defaults', error: 'Could not save preferences. Changes apply until this page closes.',
}
const zh: typeof en = {
  title: 'ASCII 鲸鱼', description: '让鲸群游过留白，让思绪慢慢浮出水面。',
  enabled: '显示鲸鱼', count: '鲸鱼数量', speed: '游动速度', size: '鲸鱼大小', opacity: '透明度',
  glass: '毛玻璃输入框', blur: '玻璃模糊（px）',
  gridScale: '字符栅格（倍）', gridOpacity: '底纹网格透明度', glassOpacity: '玻璃不透明度',
  fishCount: '小鱼数量', wake: '尾迹强度', color: '鲸鱼颜色',
  glyphMode: '字符风格', ascii: 'ASCII', hanzi: '汉字',
  fontSource: '字体', bundled: '内置默认', local: '本机自定义', asciiFont: '英文字体名称', hanziFont: '中文字体名称',
  fontHint: '默认：Geist Mono 600 / 思源宋体。本机字体填写已安装的名称，留空或未安装时回退到内置字体。',
  scanFonts: '扫描本机字体', scanning: '扫描中…', chooseAscii: '选择英文字体', chooseHanzi: '选择中文字体',
  fontUnsupported: '当前浏览器不支持列出本机字体，仍可手动输入已安装的字体名称。', fontDenied: '未获得字体访问权限，可在浏览器权限设置中允许，或手动输入字体名称。', fontScanFailed: '扫描失败，请重试或手动输入字体名称。', fontScanDone: '已找到字体家族：',
  blue: 'DeepSeek 蓝', cyan: '海水青', purple: '鸢尾紫', pink: '玫瑰粉', orange: '琥珀橙', green: '薄荷绿',
  note: '让字成海：目落在眼，鳍舒展，尾随波。为鲸群、游鱼和尾迹选一种颜色；网格、小鱼、尾迹设为 0 可隐藏。偏好保存在当前浏览器，并遵循系统减少动态效果设置。',
  reset: '恢复默认', error: '偏好保存失败，本次更改仅在当前页面有效。',
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { 'ascii-whales': keyof typeof en }
}
declare global { interface Window { queryLocalFonts?: () => Promise<{ family: string }[]> } }
export const inject = ['slots', 'locale']
export function apply(ctx: Context) {
  let settings = { ...defaults }
  try { settings = readSettings(window.localStorage) } catch { /* Storage may be disabled by the browser. */ }
  const backgrounds = mountBackgrounds(() => settings)
  ctx.effect(() => () => backgrounds.dispose())
  ctx.effect(() => ctx.locale.register('ascii-whales', { en, zh }))
  const t = ctx.locale.bind('ascii-whales')
  let localFonts: string[] = []
  function Settings() {
    const [value, setValue] = useState(settings)
    const [error, setError] = useState(false)
    const [fontList, setFontList] = useState(localFonts)
    const [fontMenu, setFontMenu] = useState<'asciiFont' | 'hanziFont' | null>(null)
    const [scanning, setScanning] = useState(false)
    const [fontMessage, setFontMessage] = useState('')
    async function scanFonts() {
      if (!window.queryLocalFonts) { setFontMessage(t('fontUnsupported')); return }
      setScanning(true); setFontMessage('')
      try {
        const fonts = await window.queryLocalFonts()
        localFonts = [...new Set(fonts.map(font => font.family).filter(name => normalize({ asciiFont: name }).asciiFont === name && name.length > 0))].sort((a, b) => a.localeCompare(b))
        setFontList(localFonts); setFontMessage(`${t('fontScanDone')} ${localFonts.length}`)
      } catch (error) { setFontMessage(t(error instanceof DOMException && error.name === 'NotAllowedError' ? 'fontDenied' : 'fontScanFailed')) }
      finally { setScanning(false) }
    }
    function save(next: typeof defaults) {
      settings = normalize(next); setValue(settings); backgrounds.update()
      try { localStorage.setItem(storageKey, JSON.stringify(settings)); setError(false) }
      catch { setError(true) }
    }
    return <div className="dsh-whales-settings" style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
      <div><h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{t('title')}</h2><p style={{ color: 'var(--dsw-fg-muted)' }}>{t('description')}</p></div>
      <div className="setCard setCardOpen" style={{ padding: 20, display: 'grid', gap: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{t('enabled')}</span><Switch label={t('enabled')} checked={value.enabled} onChange={enabled => save({ ...value, enabled })}/></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{t('glass')}</span><Switch label={t('glass')} checked={value.glass} onChange={glass => save({ ...value, glass })}/></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{t('glyphMode')}</span><div role="group" aria-label={t('glyphMode')} style={{ display: 'flex', gap: 8 }}>
            {(['ascii', 'hanzi'] as const).map(glyphMode => <Button key={glyphMode} aria-pressed={value.glyphMode === glyphMode} variant={value.glyphMode === glyphMode ? 'primary' : undefined} onClick={() => save({ ...value, glyphMode })}>{t(glyphMode)}</Button>)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>{t('fontSource')}</span><div role="group" aria-label={t('fontSource')} style={{ display: 'flex', gap: 8 }}>
              {(['bundled', 'local'] as const).map(fontSource => <Button key={fontSource} aria-pressed={value.fontSource === fontSource} variant={value.fontSource === fontSource ? 'primary' : undefined} onClick={() => save({ ...value, fontSource })}>{t(fontSource)}</Button>)}
            </div>
          </div>
          {value.fontSource === 'local' && <>
            <div><Button variant="toolbar" disabled={scanning} onClick={scanFonts}>{t(scanning ? 'scanning' : 'scanFonts')}</Button></div>
            {fontMessage && <p role="status" style={{ margin: 0, fontSize: 12 }}>{fontMessage}</p>}
            {(['asciiFont', 'hanziFont'] as const).map(key => <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span>{t(key)}</span><div style={{ display: 'flex', gap: 4, maxWidth: '65%' }}>
                <Input aria-label={t(key)} value={value[key]} maxLength={100} placeholder={key === 'asciiFont' ? 'Consolas' : '方正屏显雅宋简体'} style={{ width: 200, maxWidth: '100%' }} onChange={event => save({ ...value, [key]: event.target.value })}/>
                <Menu open={fontMenu === key} portal align="end" selectedId={value[key]} items={fontList.map(name => ({ id: name, label: name }))} onClose={() => setFontMenu(null)} onSelect={name => { save({ ...value, [key]: name }); setFontMenu(null) }} anchor={<Button variant="toolbar" aria-label={t(key === 'asciiFont' ? 'chooseAscii' : 'chooseHanzi')} aria-haspopup="menu" aria-expanded={fontMenu === key} disabled={!fontList.length} onClick={() => setFontMenu(fontMenu === key ? null : key)}><IconChevronDownOutlineMedium aria-hidden="true"/></Button>}/>
              </div>
            </div>)}
          </>}
          <p style={{ margin: 0, fontSize: 12, color: 'var(--dsw-fg-muted)', lineHeight: 1.6 }}>{t('fontHint')}</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span>{t('color')}</span><span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><code>{value.color}</code><Input type="color" aria-label={t('color')} value={value.color} style={{ width: 48, height: 28, cursor: 'pointer' }} onChange={event => save({ ...value, color: event.target.value })}/></span></label>
          <div role="group" aria-label={t('color')} style={{ display: 'flex', gap: 12 }}>
            {([['blue', '#4d6bfe'], ['cyan', '#06b6d4'], ['purple', '#a855f7'], ['pink', '#ec4899'], ['orange', '#f59e0b'], ['green', '#10b981']] as const).map(([name, color]) => <Button key={name} aria-label={t(name)} title={t(name)} aria-pressed={value.color === color} onClick={() => save({ ...value, color })} style={{ background: color, width: 28, height: 28, padding: 0, borderRadius: '50%', border: '2px solid var(--dsw-alias-bg-layer-1)', outline: value.color === color ? '2px solid var(--dsw-alias-label-primary)' : '1px solid transparent' }} />)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 24px' }}>
          {(Object.keys(ranges) as (keyof typeof ranges)[]).map(key => <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>{t(key)}</span><Input aria-label={t(key)} type="number" min={ranges[key][0]} max={ranges[key][1]} step={inputStep(key, value[key])} value={value[key]} style={{ width: 80 }} onChange={event => {
              let next = event.target.valueAsNumber
              // Native stepping down from 1 uses the lower interval; typed values stay untouched.
              if (fractionalSteps.includes(key) && value[key] === 1 && next === .9 && !(event.nativeEvent instanceof InputEvent)) next = .95
              if (event.target.value !== '' && Number.isFinite(next)) save({ ...value, [key]: next })
            }}/>
          </label>)}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--dsw-fg-muted)', lineHeight: 1.6 }}>{t('note')}</p>
      {error && <p role="alert">{t('error')}</p>}
      <div><Button variant="primary" onClick={() => save({ ...defaults })}>{t('reset')}</Button></div>
    </div>
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'ascii-whales', order: 57, locale: 'ascii-whales',
    label: () => t('title'),
  }, Settings))
}

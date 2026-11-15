import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { Button, Input, Switch, Menu, IconChevronDownOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { useState, type ReactNode } from 'react'
import { defaults, normalize, ranges, readSettings, storageKey, fractionalSteps, inputStep, glassKeys } from './settings.mjs'
import { mountBackgrounds } from './background.mjs'

const en = {
  title: 'ASCII Whales', description: 'Let whales drift through the quiet, and thoughts rise to the surface.',
  enabled: 'Show ocean', count: 'Whale count', speed: 'Swimming speed', bodySwing: 'Body swing amplitude', turnAgility: 'Turning agility', tailFrequency: 'Tail-beat frequency', size: 'Whale size', opacity: 'Opacity',
  species: 'Whale species', humpback: 'Humpback', orca: 'Orca',
  eyeColor: 'Eye background', primary: 'Follow main color', black: 'Black', white: 'White',
  colorfulShimmer: 'Colorful shimmer', shimmerHint: 'ASCII / Hanzi only. Off: shades of your selected color. On: original seven-color accents.',
  showInChat: 'Show whales in chat', chatHint: 'Keep the ocean behind conversation messages. Background frosted glass adds a layered mist behind text; adjust its blur and opacity for readability.',
  chatGlass: 'Frosted-glass chat background', chatBlur: 'Background blur (px)', chatGlassOpacity: 'Background opacity',
  glass: 'Frosted-glass composer', blur: 'Composer blur (px)',
  gridScale: 'Cell size (×)', gridOpacity: 'Grid opacity', glassOpacity: 'Composer opacity',
  fishCount: 'Small fish count', wake: 'Wake intensity', color: 'Ocean color',
  glyphMode: 'Character style', ascii: 'ASCII', hanzi: 'Hanzi', kanji: 'Kanji',
  fontSource: 'Font source', bundled: 'Bundled default', local: 'Local custom', asciiFont: 'English font name', hanziFont: 'Chinese font name',
  fontHint: 'Defaults: Geist Mono 600 / Source Han Serif. Local names use fonts installed on this device; blank or unavailable names fall back to the bundled font.',
  scanFonts: 'Scan local fonts', scanning: 'Scanning…', chooseAscii: 'Choose English font', chooseHanzi: 'Choose Chinese font',
  fontUnsupported: 'This browser cannot list local fonts. You can still type an installed font name.', fontDenied: 'Font access was not granted. Allow it in browser permissions or enter a name manually.', fontScanFailed: 'Could not scan fonts. Try again or enter a name manually.', fontScanDone: 'Font families found:',
  blue: 'DeepSeek blue', cyan: 'Cyan', purple: 'Violet', pink: 'Rose', orange: 'Amber', green: 'Mint',
  note: 'Let the sea take shape in letters or Hanzi: 目 for eyes, 鳍 for fins, 尾 for tails. Choose a color for whales, fish and wakes. Set grid, fish or wake to 0 to hide them. Saved in this browser; reduced motion is respected.',
  reset: 'Restore defaults', error: 'Could not save preferences. Changes apply until this page closes.',
  sectionDisplay: 'Display', sectionWhales: 'Whales', sectionLook: 'Look', sectionFont: 'Font',
}
const zh: typeof en = {
  title: 'ASCII 鲸鱼', description: '让鲸群游过留白，让思绪慢慢浮出水面。',
  enabled: '显示海洋', count: '鲸鱼数量', speed: '游动速度', bodySwing: '身体摆动幅度', turnAgility: '转弯灵活度', tailFrequency: '摆尾频率', size: '鲸鱼大小', opacity: '透明度',
  species: '鲸鱼种类', humpback: '座头鲸', orca: '虎鲸',
  eyeColor: '眼睛底色', primary: '跟随主色', black: '黑色', white: '白色',
  colorfulShimmer: '彩色闪烁', shimmerHint: '适用于 ASCII / 汉字。关闭时使用主色深浅，开启后使用原版七色点缀。',
  showInChat: '聊天中显示鲸鱼', chatHint: '让海洋持续显示在对话消息后方。开启背景毛玻璃可在文字后方增加多层雾面，调节背景模糊与不透明度可改善可读性。',
  chatGlass: '背景毛玻璃', chatBlur: '背景模糊（px）', chatGlassOpacity: '背景不透明度',
  glass: '输入框毛玻璃', blur: '输入框模糊（px）',
  gridScale: '字符栅格（倍）', gridOpacity: '底纹网格透明度', glassOpacity: '输入框不透明度',
  fishCount: '小鱼数量', wake: '尾迹强度', color: '海洋颜色',
  glyphMode: '字符风格', ascii: 'ASCII', hanzi: '汉字', kanji: 'Kanji',
  fontSource: '字体来源', bundled: '内置默认', local: '本机自定义', asciiFont: '英文字体名称', hanziFont: '中文字体名称',
  fontHint: '默认：Geist Mono 600 / 思源宋体。本机字体填写已安装的名称，留空或未安装时回退到内置字体。',
  scanFonts: '扫描本机字体', scanning: '扫描中…', chooseAscii: '选择英文字体', chooseHanzi: '选择中文字体',
  fontUnsupported: '当前浏览器不支持列出本机字体，仍可手动输入已安装的字体名称。', fontDenied: '未获得字体访问权限，可在浏览器权限设置中允许，或手动输入字体名称。', fontScanFailed: '扫描失败，请重试或手动输入字体名称。', fontScanDone: '已找到字体家族：',
  blue: 'DeepSeek 蓝', cyan: '海水青', purple: '鸢尾紫', pink: '玫瑰粉', orange: '琥珀橙', green: '薄荷绿',
  note: '让字成海：目落在眼，鳍舒展，尾随波。为鲸群、游鱼和尾迹选一种颜色；网格、小鱼、尾迹设为 0 可隐藏。偏好保存在当前浏览器，并遵循系统减少动态效果设置。',
  reset: '恢复默认', error: '偏好保存失败，本次更改仅在当前页面有效。',
  sectionDisplay: '显示', sectionWhales: '鲸群', sectionLook: '外观', sectionFont: '字体',
}
// Layout follows the Reference Anything settings spec: body 14/22, caption 12/18, heading 20/28 500,
// 4px spacing steps, 36px controls, 20px card radius, 0.5px hairlines, DSH --dsw-alias-* tokens.
const settingsCss = `
.dsh-whales-settings{--w-l1:var(--dsw-alias-label-primary,#0f1115);--w-l3:var(--dsw-alias-label-tertiary,#81858c);--w-line:var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  display:grid;gap:16px;max-width:720px;padding:24px 0 56px;color:var(--w-l1);font-size:14px;line-height:22px}
.dsh-whales-settings .w-head h2{margin:0;font-size:20px;line-height:28px;font-weight:500}
.dsh-whales-settings .w-head p{margin:4px 0 0;font-size:13px;line-height:20px;color:var(--w-l3)}
.dsh-whales-settings .w-section{margin:8px 0 -8px 4px;font-size:12px;line-height:18px;font-weight:500;color:var(--w-l3)}
.dsh-whales-settings .w-card{padding:4px 16px;border-radius:20px;background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2,#fff));border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l4,rgba(0,0,0,.16)))}
.dsh-whales-settings .w-row{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:44px;padding:12px 0}
.dsh-whales-settings .w-card > * + *{border-top:.5px solid var(--w-line)}
.dsh-whales-settings .w-text{display:grid;gap:4px;min-width:0}
.dsh-whales-settings .w-desc{margin:0;font-size:12px;line-height:18px;color:var(--w-l3)}
.dsh-whales-settings .w-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex:none}
.dsh-whales-settings .w-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:24px;padding:4px 0}
.dsh-whales-settings .w-grid .w-row{min-height:0;padding:8px 0}
.dsh-whales-settings .w-sub{padding:0 0 8px 16px}
.dsh-whales-settings .w-disabled{opacity:.42}
.dsh-whales-settings input[type=number]{width:80px;height:36px;box-sizing:border-box}
.dsh-whales-settings .w-hex,.dsh-whales-settings .w-hex input{width:88px;font-family:var(--dsw-font-family-mono,"SF Mono",Consolas,monospace);font-size:12px}
.dsh-whales-settings .w-foot{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
.dsh-whales-settings .w-foot > button{flex:none;white-space:nowrap}
.dsh-whales-settings .w-swatch{width:24px!important;height:24px!important;min-width:0!important;padding:0!important;border-radius:50%!important;corner-shape:round!important}
.dsh-whales-settings .w-foot p{margin:0;font-size:12px;line-height:18px;color:var(--w-l3)}
@media (max-width:640px){
  .dsh-whales-settings .w-grid{grid-template-columns:1fr}
  .dsh-whales-settings .w-row:not(.w-num){flex-direction:column;align-items:flex-start;gap:8px}
  .dsh-whales-settings .w-controls{justify-content:flex-start}
  .dsh-whales-settings .w-foot{flex-direction:column}
}`
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
    const [hexDraft, setHexDraft] = useState<string | null>(null)
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
    const numberField = (key: keyof typeof ranges, disabled = false) => <label key={key} className={`w-row w-num${disabled ? ' w-disabled' : ''}`}>
      <span>{t(key)}</span><Input aria-label={t(key)} type="number" disabled={disabled} min={ranges[key][0]} max={ranges[key][1]} step={inputStep(key, value[key])} value={value[key]} onChange={event => {
        let next = event.target.valueAsNumber
        // Native stepping down from 1 uses the lower interval; typed values stay untouched.
        if (fractionalSteps.includes(key) && value[key] === 1 && next === .9 && !(event.nativeEvent instanceof InputEvent)) next = .95
        if (event.target.value !== '' && Number.isFinite(next)) save({ ...value, [key]: next })
      }}/>
    </label>
    const numbers = (keys: (keyof typeof ranges)[], disabled = false) => <div className="w-grid">{keys.map(key => numberField(key, disabled))}</div>
    const row = (label: string, control: ReactNode, desc?: string) => <div className="w-row">
      <div className="w-text"><span>{label}</span>{desc && <p className="w-desc">{desc}</p>}</div>
      <div className="w-controls">{control}</div>
    </div>
    const toggle = (key: 'enabled' | 'showInChat' | 'chatGlass' | 'glass' | 'colorfulShimmer', desc?: string, disabled = false) =>
      row(t(key), <Switch label={t(key)} disabled={disabled} checked={value[key]} onChange={on => save({ ...value, [key]: on })}/>, desc)
    const choice = <K extends 'species' | 'glyphMode' | 'fontSource' | 'eyeColor'>(key: K, options: readonly (typeof defaults)[K][], label = key) =>
      row(t(label), <div role="group" aria-label={t(label)} className="w-controls">
        {options.map(option => <Button key={option} aria-pressed={value[key] === option} variant={value[key] === option ? 'primary' : undefined} onClick={() => save({ ...value, [key]: option })}>{t(option as keyof typeof en)}</Button>)}
      </div>)
    const glassGroup = (key: keyof typeof glassKeys) => <div key={key}>
      {toggle(key)}
      <div className="w-sub">{numbers(glassKeys[key] as (keyof typeof ranges)[], !value[key])}</div>
    </div>
    const swatches = [['blue', '#4d6bfe'], ['cyan', '#06b6d4'], ['purple', '#a855f7'], ['pink', '#ec4899'], ['orange', '#f59e0b'], ['green', '#10b981']] as const
    return <div className="dsh-whales-settings">
      <style>{settingsCss}</style>
      <div className="w-head"><h2>{t('title')}</h2><p>{t('description')}</p></div>

      <div className="w-section">{t('sectionDisplay')}</div>
      <div className="w-card">
        {toggle('enabled')}
        {toggle('showInChat', t('chatHint'), !value.enabled)}
        {glassGroup('chatGlass')}
        {glassGroup('glass')}
      </div>

      <div className="w-section">{t('sectionWhales')}</div>
      <div className="w-card">
        {choice('species', ['humpback', 'orca'])}
        {numbers(['count', 'size', 'speed', 'opacity', 'bodySwing', 'turnAgility', 'tailFrequency'])}
      </div>

      <div className="w-section">{t('sectionLook')}</div>
      <div className="w-card">
        {choice('glyphMode', ['ascii', 'hanzi', 'kanji'])}
        {row(t('color'), <>
          <div role="group" aria-label={t('color')} className="w-controls" style={{ alignItems: 'center' }}>
            {swatches.map(([name, color]) => <Button key={name} aria-label={t(name)} title={t(name)} className="w-swatch" aria-pressed={value.color === color} onClick={() => save({ ...value, color })} style={{ background: color, border: '2px solid var(--dsw-alias-bg-layer-2, #fff)', outline: value.color === color ? '2px solid var(--dsw-alias-label-primary)' : '1px solid transparent' }} />)}
          </div>
          <Input aria-label={`${t('color')} hex`} className="w-hex" value={hexDraft ?? value.color} maxLength={7} spellCheck={false} onChange={event => {
            const text = event.target.value.trim(), hex = text.startsWith('#') ? text : '#' + text
            setHexDraft(text)
            if (/^#[\da-f]{6}$/i.test(hex)) save({ ...value, color: hex.toLowerCase() })
          }} onBlur={() => setHexDraft(null)}/>
          <Input type="color" aria-label={t('color')} value={value.color} style={{ width: 36, height: 36, padding: 2, cursor: 'pointer' }} onChange={event => save({ ...value, color: event.target.value })}/>
        </>)}
        {choice('eyeColor', ['primary', 'black', 'white'])}
        {toggle('colorfulShimmer', t('shimmerHint'), value.glyphMode === 'kanji')}
        {numbers(['gridScale', 'gridOpacity', 'fishCount', 'wake'])}
      </div>

      <div className="w-section">{t('sectionFont')}</div>
      <div className="w-card">
        {row(t('fontSource'), <div role="group" aria-label={t('fontSource')} className="w-controls">
          {(['bundled', 'local'] as const).map(fontSource => <Button key={fontSource} aria-pressed={value.fontSource === fontSource} variant={value.fontSource === fontSource ? 'primary' : undefined} onClick={() => save({ ...value, fontSource })}>{t(fontSource)}</Button>)}
        </div>, t('fontHint'))}
        {value.fontSource === 'local' && <>
          {row(t('scanFonts'), <Button variant="toolbar" disabled={scanning} onClick={scanFonts}>{t(scanning ? 'scanning' : 'scanFonts')}</Button>, fontMessage || undefined)}
          {(['asciiFont', 'hanziFont'] as const).map(key => <div key={key}>{row(t(key), <>
            <Input aria-label={t(key)} value={value[key]} maxLength={100} placeholder={key === 'asciiFont' ? 'Consolas' : '方正屏显雅宋简体'} style={{ width: 200, maxWidth: '100%' }} onChange={event => save({ ...value, [key]: event.target.value })}/>
            <Menu open={fontMenu === key} portal align="end" selectedId={value[key]} items={fontList.map(name => ({ id: name, label: name }))} onClose={() => setFontMenu(null)} onSelect={name => { save({ ...value, [key]: name }); setFontMenu(null) }} anchor={<Button variant="toolbar" aria-label={t(key === 'asciiFont' ? 'chooseAscii' : 'chooseHanzi')} aria-haspopup="menu" aria-expanded={fontMenu === key} disabled={!fontList.length} onClick={() => setFontMenu(fontMenu === key ? null : key)}><IconChevronDownOutlineMedium aria-hidden="true"/></Button>}/>
          </>)}</div>)}
        </>}
      </div>

      {error && <p role="alert" className="w-desc" style={{ color: 'var(--dsw-alias-state-error-primary, #ec1313)' }}>{t('error')}</p>}
      <div className="w-foot"><p>{t('note')}</p><Button variant="primary" onClick={() => save({ ...defaults })}>{t('reset')}</Button></div>
    </div>
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'ascii-whales', order: 57, locale: 'ascii-whales',
    label: () => t('title'),
  }, Settings))
}

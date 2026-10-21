import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { Button, Input, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import { useState } from 'react'
import { defaults, normalize, ranges, readSettings, storageKey } from './settings.mjs'
import { mountBackgrounds } from './background.mjs'

const en = {
  title: 'ASCII Whales', description: 'Let whales drift through the quiet, and thoughts rise to the surface.',
  enabled: 'Show whales', count: 'Whale count', speed: 'Swimming speed', size: 'Whale size', opacity: 'Opacity',
  glass: 'Frosted-glass composer', blur: 'Glass blur (px)',
  gridScale: 'Cell size (×)', gridOpacity: 'Grid opacity', glassOpacity: 'Glass opacity',
  fishCount: 'Small fish count', wake: 'Wake intensity', color: 'Whale color',
  blue: 'DeepSeek blue', cyan: 'Cyan', purple: 'Violet', pink: 'Rose', orange: 'Amber', green: 'Mint',
  note: 'Choose a color for whales, fish and wakes. Set grid, fish or wake to 0 to hide them. Glass stays neutral. Saved in this browser; reduced motion is respected.',
  reset: 'Restore defaults', error: 'Could not save preferences. Changes apply until this page closes.',
}
const zh: typeof en = {
  title: 'ASCII 鲸鱼', description: '让鲸群游过留白，让思绪慢慢浮出水面。',
  enabled: '显示鲸鱼', count: '鲸鱼数量', speed: '游动速度', size: '鲸鱼大小', opacity: '透明度',
  glass: '毛玻璃输入框', blur: '玻璃模糊（px）',
  gridScale: '字符栅格（倍）', gridOpacity: '底纹网格透明度', glassOpacity: '玻璃不透明度',
  fishCount: '小鱼数量', wake: '尾迹强度', color: '鲸鱼颜色',
  blue: 'DeepSeek 蓝', cyan: '海水青', purple: '鸢尾紫', pink: '玫瑰粉', orange: '琥珀橙', green: '薄荷绿',
  note: '为鲸群、游鱼和尾迹选一种颜色。网格、小鱼、尾迹设为 0 可隐藏；玻璃保持中性。偏好保存在当前浏览器，并遵循系统减少动态效果设置。',
  reset: '恢复默认', error: '偏好保存失败，本次更改仅在当前页面有效。',
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { 'ascii-whales': keyof typeof en }
}
export const inject = ['slots', 'locale']
export function apply(ctx: Context) {
  let settings = { ...defaults }
  try { settings = readSettings(window.localStorage) } catch { /* Storage may be disabled by the browser. */ }
  const backgrounds = mountBackgrounds(() => settings)
  ctx.effect(() => () => backgrounds.dispose())
  ctx.effect(() => ctx.locale.register('ascii-whales', { en, zh }))
  const t = ctx.locale.bind('ascii-whales')
  function Settings() {
    const [value, setValue] = useState(settings)
    const [error, setError] = useState(false)
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
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span>{t('color')}</span><span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><code>{value.color}</code><Input type="color" aria-label={t('color')} value={value.color} style={{ width: 48, height: 28, cursor: 'pointer' }} onChange={event => save({ ...value, color: event.target.value })}/></span></label>
          <div role="group" aria-label={t('color')} style={{ display: 'flex', gap: 12 }}>
            {([['blue', '#4d6bfe'], ['cyan', '#06b6d4'], ['purple', '#a855f7'], ['pink', '#ec4899'], ['orange', '#f59e0b'], ['green', '#10b981']] as const).map(([name, color]) => <Button key={name} aria-label={t(name)} title={t(name)} aria-pressed={value.color === color} onClick={() => save({ ...value, color })} style={{ background: color, width: 28, height: 28, padding: 0, borderRadius: '50%', border: '2px solid var(--dsw-alias-bg-layer-1)', outline: value.color === color ? '2px solid var(--dsw-alias-label-primary)' : '1px solid transparent' }} />)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 24px' }}>
          {(Object.keys(ranges) as (keyof typeof ranges)[]).map(key => <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>{t(key)}</span><Input aria-label={t(key)} type="number" min={ranges[key][0]} max={ranges[key][1]} step={ranges[key][2]} value={value[key]} style={{ width: 80 }} onChange={event => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) save({ ...value, [key]: event.target.valueAsNumber }) }}/>
          </label>)}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--dsw-fg-muted)', lineHeight: 1.6 }}>{t('note')}</p>
      {error && <p role="alert">{t('error')}</p>}
      <div><Button variant="primary" style={{ background: '#111', color: '#fff', border: '1px solid #666' }} onClick={() => save({ ...defaults })}>{t('reset')}</Button></div>
    </div>
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'ascii-whales', order: 57, locale: 'ascii-whales',
    label: () => t('title'),
  }, Settings))
}

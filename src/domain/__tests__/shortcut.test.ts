import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../data/db'
import { activeShortcut, shortcutUrl } from '../shortcut'

describe('iPhone-timer via Snarveier', () => {
  it('lager riktig lenke med sekunder som input', () => {
    expect(shortcutUrl('Pausetimer', 120)).toBe('shortcuts://run-shortcut?name=Pausetimer&input=text&text=120')
    expect(shortcutUrl('Min timer', 75.4)).toBe('shortcuts://run-shortcut?name=Min%20timer&input=text&text=75')
  })

  it('er av som standard, og tomt navn gir standardnavnet', () => {
    const s = defaultSettings()
    expect(activeShortcut(s)).toBeNull()
    expect(activeShortcut({ ...s, shortcutTimer: true, shortcutName: '  ' })).toBe('Pausetimer')
    expect(activeShortcut({ ...s, shortcutTimer: true, shortcutName: 'Hvile' })).toBe('Hvile')
  })

  it('eldre data uten feltene regnes som av', () => {
    const { shortcutTimer: _a, shortcutName: _b, ...old } = defaultSettings()
    expect(activeShortcut(old)).toBeNull()
  })
})

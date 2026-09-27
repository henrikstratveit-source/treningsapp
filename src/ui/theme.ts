import type { Theme } from '../domain/types'

const KEY = 'utseende'

/** Sett utseende på <html>. Speiles i localStorage så riktig utseende vises før databasen er lest. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'ny' ? '#16191e' : '#111418')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // privat modus o.l.
  }
}

export function initialTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'klassisk' ? 'klassisk' : 'ny'
  } catch {
    return 'ny'
  }
}

// iPhone-timer via Snarveier. En nettapp kan ikke vise noe i Dynamic Island, men den kan starte
// en snarvei som setter en vanlig Klokke-timer – den vises i Dynamic Island og ringer når tida er ute.
import type { Settings } from './types'

export const DEFAULT_SHORTCUT_NAME = 'Pausetimer'

/** Lenke som kjører snarveien med antall sekunder som tekst-input. */
export function shortcutUrl(name: string, seconds: number): string {
  return `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${Math.round(seconds)}`
}

/** Navnet på snarveien hvis funksjonen er slått på, ellers null. */
export function activeShortcut(s: Settings | undefined): string | null {
  if (!s?.shortcutTimer) return null
  return s.shortcutName?.trim() || DEFAULT_SHORTCUT_NAME
}

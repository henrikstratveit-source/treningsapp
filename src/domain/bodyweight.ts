// Kroppsvekt (SPEC 10, svar 18). Uker = mandag–søndag; uker med < 3 målinger regnes ikke med.
import { addDays, daysBetween, mondayOf } from './dates'
import type { BodyweightEntry } from './types'

export const MIN_PER_WEEK = 3
export const MSG_WEIGHT_STALLED = 'Vekta står stille. Spis mer.'

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sorted = (e: BodyweightEntry[]) => [...e].sort((a, b) => a.date.localeCompare(b.date))

/** 7-dagers glidende snitt: for hver måling, snitt av målinger de siste 7 dagene (inkl. dagen). */
export function movingAverage7(entries: BodyweightEntry[]): { date: string; kg: number; avg7: number }[] {
  const s = sorted(entries)
  return s.map((e) => {
    const from = addDays(e.date, -6)
    return { date: e.date, kg: e.kg, avg7: avg(s.filter((x) => x.date >= from && x.date <= e.date).map((x) => x.kg)) }
  })
}

export interface WeekAverage {
  /** Mandag */
  week: string
  avg: number
  count: number
  valid: boolean
  /** Fullført uke (søndag er passert) */
  full: boolean
  /** Endring fra forrige gyldige uke */
  change: number | null
}

export function weeklyAverages(entries: BodyweightEntry[], today: string): WeekAverage[] {
  const groups = new Map<string, number[]>()
  for (const e of sorted(entries)) {
    const w = mondayOf(e.date)
    groups.set(w, [...(groups.get(w) ?? []), e.kg])
  }
  const current = mondayOf(today)
  let prev: number | null = null
  return [...groups].map(([week, kgs]) => {
    const a = avg(kgs)
    const valid = kgs.length >= MIN_PER_WEEK
    const change = valid && prev !== null ? a - prev : null
    if (valid) prev = a
    return { week, avg: a, count: kgs.length, valid, full: week < current, change }
  })
}

/** Gyldige, fullførte uker. */
const fullValid = (entries: BodyweightEntry[], today: string) =>
  weeklyAverages(entries, today).filter((w) => w.valid && w.full)

/** Varsel: ukessnittet har ikke økt med minst 0,1 kg to fulle uker på rad. */
export function weightStalled(entries: BodyweightEntry[], today: string): boolean {
  const w = fullValid(entries, today)
  if (w.length < 3) return false
  const [a, b, c] = w.slice(-3).map((x) => x.avg)
  const eps = 1e-9
  return b - a < 0.1 - eps && c - b < 0.1 - eps
}

/**
 * Snittendring per uke de siste 4 ukene: fra gyldig uke inntil 4 uker før siste gyldige fulle uke
 * til den siste, delt på antall uker mellom dem. null hvis for lite data.
 */
export function recentRate(entries: BodyweightEntry[], today: string): number | null {
  const w = fullValid(entries, today)
  if (w.length < 2) return null
  const last = w[w.length - 1]
  const first = w.find((x) => daysBetween(x.week, last.week) <= 28)!
  const weeks = daysBetween(first.week, last.week) / 7
  return weeks > 0 ? (last.avg - first.avg) / weeks : null
}

export interface BodyweightSummary {
  latest: BodyweightEntry | null
  /** Siste 7-dagers snitt */
  current: number | null
  /** Endring hittil: 7-dagers snitt − startvekt */
  changeSoFar: number | null
  rate4w: number | null
  /** Sammenligning mot mål-tempo, hvis satt */
  vsTarget: 'over' | 'under' | 'på' | null
  stalled: boolean
}

export function summarizeBodyweight(
  entries: BodyweightEntry[],
  today: string,
  startWeight: number,
  targetRate: number | null,
): BodyweightSummary {
  const ma = movingAverage7(entries)
  const last = ma[ma.length - 1]
  const current = last ? last.avg7 : null
  const rate4w = recentRate(entries, today)
  let vsTarget: BodyweightSummary['vsTarget'] = null
  if (targetRate !== null && rate4w !== null) {
    const d = rate4w - targetRate
    vsTarget = Math.abs(d) < 0.05 ? 'på' : d > 0 ? 'over' : 'under'
  }
  return {
    latest: last ? { date: last.date, kg: last.kg } : null,
    current,
    changeSoFar: current !== null ? current - startWeight : null,
    rate4w,
    vsTarget,
    stalled: weightStalled(entries, today),
  }
}

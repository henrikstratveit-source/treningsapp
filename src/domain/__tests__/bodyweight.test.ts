import { describe, expect, it } from 'vitest'
import { addDays } from '../dates'
import {
  movingAverage7,
  recentRate,
  summarizeBodyweight,
  weeklyAverages,
  weightStalled,
} from '../bodyweight'
import type { BodyweightEntry } from '../types'

/** Tre målinger (man, ons, fre) som gir ønsket ukessnitt. */
function week(monday: string, avg: number, n = 3): BodyweightEntry[] {
  const days = [0, 2, 4, 5, 6].slice(0, n)
  return days.map((d) => ({ date: addDays(monday, d), kg: avg }))
}

// Mandager
const W1 = '2026-08-31'
const W2 = '2026-09-07'
const W3 = '2026-09-14'
const W4 = '2026-09-21'
const TODAY = '2026-09-28' // mandag, W4 er fullført

describe('kroppsvekt (SPEC 10 / 15)', () => {
  it('ukessnitt 70,0 → 70,05 → 70,02 → varsel', () => {
    const e = [...week(W1, 70.0), ...week(W2, 70.05), ...week(W3, 70.02)]
    expect(weightStalled(e, TODAY)).toBe(true)
  })

  it('en uke med bare 2 målinger regnes ikke med', () => {
    const e = [...week(W1, 70.0), ...week(W2, 71, 2), ...week(W3, 70.05), ...week(W4, 70.02)]
    expect(weightStalled(e, TODAY)).toBe(true)
    const w = weeklyAverages(e, TODAY)
    expect(w.find((x) => x.week === W2)?.valid).toBe(false)
  })

  it('økning på minst 0,1 kg → ingen varsel', () => {
    const e = [...week(W1, 70.0), ...week(W2, 70.1), ...week(W3, 70.15)]
    expect(weightStalled(e, TODAY)).toBe(false)
  })

  it('bare én uke uten økning → ingen varsel', () => {
    const e = [...week(W1, 70.0), ...week(W2, 70.3), ...week(W3, 70.3)]
    expect(weightStalled(e, TODAY)).toBe(false)
  })

  it('inneværende (ufullført) uke teller ikke', () => {
    const e = [...week(W2, 70.0), ...week(W3, 70.05), ...week(W4, 70.02)]
    expect(weightStalled(e, '2026-09-25')).toBe(false)
    expect(weightStalled(e, TODAY)).toBe(true)
  })

  it('7-dagers glidende snitt', () => {
    const e = [
      { date: '2026-09-01', kg: 68 },
      { date: '2026-09-03', kg: 70 },
      { date: '2026-09-09', kg: 72 },
    ]
    expect(movingAverage7(e).map((x) => x.avg7)).toEqual([68, 69, 71])
  })

  it('endring per uke og snitt siste 4 uker', () => {
    const e = [...week(W1, 68), ...week(W2, 68.3), ...week(W3, 68.5), ...week(W4, 68.9)]
    const w = weeklyAverages(e, TODAY)
    expect(w[1].change).toBeCloseTo(0.3)
    expect(recentRate(e, TODAY)).toBeCloseTo(0.3)
  })

  it('sammendrag med mål-tempo', () => {
    const e = [...week(W1, 68), ...week(W2, 68.3), ...week(W3, 68.5), ...week(W4, 68.9)]
    const s = summarizeBodyweight(e, TODAY, 68, 0.25)
    expect(s.vsTarget).toBe('over')
    expect(s.changeSoFar).toBeCloseTo(0.9)
    expect(summarizeBodyweight(e, TODAY, 68, null).vsTarget).toBeNull()
  })
})

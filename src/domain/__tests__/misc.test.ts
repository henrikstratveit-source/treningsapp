import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, mondayOf } from '../dates'
import { exerciseHistory } from '../progression'
import { records } from '../records'
import { inTechniquePhase, targetRir } from '../rir'
import { roundToStep } from '../rounding'
import { warmupSets } from '../warmup'
import { reps, workout } from './helpers'

describe('datoer og avrunding', () => {
  it('mandag i uka', () => {
    expect(mondayOf('2026-09-25')).toBe('2026-09-21') // fredag
    expect(mondayOf('2026-09-27')).toBe('2026-09-21') // søndag
    expect(mondayOf('2026-09-21')).toBe('2026-09-21')
  })
  it('dager over månedsskifte', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02')
    expect(daysBetween('2026-09-29', '2026-10-02')).toBe(3)
  })
  it('avrunding til steg', () => {
    expect(roundToStep(27, 5)).toBe(25)
    expect(roundToStep(18.75, 2.5)).toBe(20)
    expect(roundToStep(7.1, 2)).toBe(8)
  })
})

describe('RIR og teknikkfase (SPEC 7)', () => {
  it('teknikkfase dag 1–14 inklusive', () => {
    expect(inTechniquePhase(true, '2026-09-01', '2026-09-14')).toBe(true)
    expect(inTechniquePhase(true, '2026-09-01', '2026-09-15')).toBe(false)
    expect(inTechniquePhase(true, null, '2026-09-15')).toBe(true)
    expect(inTechniquePhase(false, '2026-09-01', '2026-09-02')).toBe(false)
  })
  it('mål-RIR', () => {
    expect(targetRir('flerledd', 3, 3, true)).toEqual({ min: 2, max: 3 })
    expect(targetRir('flerledd', 3, 3, false)).toEqual({ min: 1, max: 2 })
    expect(targetRir('isolasjon', 2, 3, false)).toEqual({ min: 1, max: 2 })
    expect(targetRir('isolasjon', 3, 3, false)).toEqual({ min: 0, max: 0 })
  })
})

describe('oppvarming (SPEC 7)', () => {
  it('første flerledd: 50 % × 8 og 75 % × 4, avrundet til steg', () => {
    expect(warmupSets('flerledd', 40, 5, true)).toEqual([
      { weight: 20, reps: 8 },
      { weight: 30, reps: 4 },
    ])
  })
  it('senere flerledd: 60 % × 6', () => {
    expect(warmupSets('flerledd', 40, 5, false)).toEqual([{ weight: 25, reps: 6 }])
  })
  it('isolasjon eller ukjent vekt: ingen', () => {
    expect(warmupSets('isolasjon', 40, 5, true)).toEqual([])
    expect(warmupSets('flerledd', null, 5, true)).toEqual([])
  })
})

describe('rekorder', () => {
  const h = (...ws: ReturnType<typeof workout>[]) => exerciseHistory('chest_press', ws)
  it('første gang er ingen rekord', () => {
    expect(records(h(workout('2026-09-01', reps(30, [12]))))).toBeNull()
  })
  it('ny høyeste vekt', () => {
    expect(records(h(workout('2026-09-01', reps(30, [15])), workout('2026-09-03', reps(35, [10]))))?.weight).toBe(true)
  })
  it('ny beste e1RM på samme vekt', () => {
    const r = records(h(workout('2026-09-01', reps(30, [12])), workout('2026-09-03', reps(30, [13]))))
    expect(r).toMatchObject({ weight: false, e1rm: true })
  })
  it('ingen framgang → ingen rekord', () => {
    expect(records(h(workout('2026-09-01', reps(30, [12])), workout('2026-09-03', reps(30, [11]))))).toBeNull()
  })
})

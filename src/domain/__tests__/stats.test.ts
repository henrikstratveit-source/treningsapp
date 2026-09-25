import { describe, expect, it } from 'vitest'
import { seedExercises } from '../../data/seed/exercises'
import { addDays } from '../dates'
import {
  exerciseProgress,
  fullWeeksWithData,
  hardSetsAverage,
  hardSetsForWeek,
  programSuggestion,
  sessionsPerWeek,
} from '../stats'
import { reps, set, workout } from './helpers'

const exMap = new Map(seedExercises.map((e) => [e.id, e]))
const MON = '2026-09-21'

describe('statistikk (SPEC 11 / 15)', () => {
  it('3 arbeidssett chest_press → bryst 3, triceps 1,5, fremre skulder 1,5', () => {
    const w = workout('2026-09-22', [set(20, 8, { warmup: true }), ...reps(30, [12, 12, 12])])
    const h = hardSetsForWeek([w], exMap, MON)
    expect(h.get('bryst')).toBe(3)
    expect(h.get('triceps')).toBe(1.5)
    expect(h.get('fremre skulder')).toBe(1.5)
  })

  it('dårlig form teller som hardt sett, oppvarming ikke', () => {
    const w = workout('2026-09-22', [...reps(30, [12, 12]), set(30, 6, { goodForm: false })])
    expect(hardSetsForWeek([w], exMap, MON).get('bryst')).toBe(3)
  })

  it('fulle uker med data starter ved første økt', () => {
    const ws = [workout('2026-09-08', reps(30, [12]))]
    expect(fullWeeksWithData(ws, '2026-09-25', 6)).toEqual(['2026-09-07', '2026-09-14'])
  })

  it('økter per uke og snitt harde sett', () => {
    // 3 økter uke 1, 1 økt uke 2, ingen uke 3 (teller med), inneværende uke ignoreres
    const ws = [
      workout('2026-08-31', reps(30, [12, 12, 12])),
      workout('2026-09-02', reps(30, [12, 12, 12])),
      workout('2026-09-04', reps(30, [12, 12, 12])),
      workout('2026-09-08', reps(30, [12, 12, 12])),
      workout('2026-09-22', reps(30, [12, 12, 12])),
    ]
    expect(sessionsPerWeek(ws, '2026-09-25', 4)).toBeCloseTo(4 / 3)
    expect(hardSetsAverage(ws, exMap, '2026-09-25').get('bryst')).toBeCloseTo(12 / 3)
  })

  it('programforslag: bro split, ≥ 4 uker og snitt < 3,5', () => {
    const ws = []
    for (let i = 0; i < 4; i++) for (const d of [0, 2, 4]) ws.push(workout(addDays('2026-08-24', i * 7 + d), reps(30, [12])))
    expect(programSuggestion('bro_split', ws, '2026-09-25')).toContain('Du trener i snitt 3 ganger i uka')
    expect(programSuggestion('upper_lower', ws, '2026-09-25')).toBeNull()
    expect(programSuggestion('bro_split', ws.slice(3), '2026-09-25')).toBeNull() // bare 3 uker
  })

  it('ingen programforslag ved 4 økter i uka', () => {
    const ws = []
    for (let i = 0; i < 4; i++) for (const d of [0, 1, 3, 5]) ws.push(workout(addDays('2026-08-24', i * 7 + d), reps(30, [12])))
    expect(programSuggestion('bro_split', ws, '2026-09-25')).toBeNull()
  })

  it('progresjon per øvelse', () => {
    const ws = [workout('2026-09-01', reps(30, [15, 15])), workout('2026-09-03', reps(35, [10, 9]))]
    const p = exerciseProgress('chest_press', ws)
    expect(p.map((x) => x.weight)).toEqual([30, 35])
    expect(p[0].e1rm).toBe(45)
    expect(p[1].total).toBe(19)
  })
})

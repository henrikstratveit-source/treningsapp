import { describe, expect, it } from 'vitest'
import { seedExercises } from '../../data/seed/exercises'
import { seedPrograms } from '../../data/seed/programs'
import { buildPlan, isDumbbell, nextOpenSlot, slotProgress, summarize } from '../workout'
import { reps, set, workout } from './helpers'

const exMap = new Map(seedExercises.map((e) => [e.id, e]))

describe('økt-hjelpere', () => {
  it('plan-snapshot fra programøkt', () => {
    const plan = buildPlan(seedPrograms[0].sessions[0])
    expect(plan).toHaveLength(5)
    expect(plan[4]).toEqual({ slotIndex: 4, exerciseId: 'lateral_db', sets: 3, repMin: 12, repMax: 20 })
  })

  it('manualøvelser gjenkjennes', () => {
    expect(isDumbbell('lateral_db')).toBe(true)
    expect(isDumbbell('db_row')).toBe(true)
    expect(isDumbbell('lateral_cable')).toBe(false)
  })

  it('sammendrag: økning neste gang og rekord', () => {
    const w1 = workout('2026-09-01', reps(30, [12, 12, 12]))
    const w2 = workout('2026-09-03', [set(15, 8, { warmup: true }), ...reps(30, [15, 15, 15])])
    const [item] = summarize(w2, [w1, w2], exMap, true)
    expect(item.next).toMatchObject({ kind: 'increase', weight: 35 })
    expect(item.record?.e1rm).toBe(true)
    expect(item.reps).toEqual([15, 15, 15])
  })

  it('fremdrift per plass og neste åpne plass', () => {
    const w = workout('2026-09-01', [set(20, 8, { warmup: true }), ...reps(30, [12, 12, 12])])
    w.plan.push({ slotIndex: 1, exerciseId: 'flyes', sets: 3, repMin: 10, repMax: 15 })
    expect(slotProgress(w, w.plan[0])).toEqual({ logged: 3, rows: 3, done: true })
    expect(slotProgress(w, w.plan[0], 1).done).toBe(false) // ekstra sett lagt til
    expect(nextOpenSlot(w, {})).toBe(1)
    expect(nextOpenSlot(w, { 0: 1 }, 0)).toBe(1)
    expect(nextOpenSlot(w, { 0: 1 }, 1)).toBe(0) // ingen etter → første åpne
    w.sets.push(...reps(20, [12, 12, 12]).map((s) => ({ ...s, exerciseId: 'flyes', slotIndex: 1 })))
    expect(nextOpenSlot(w, {})).toBeNull()
  })

  it('sammendrag ser bort fra senere økter', () => {
    const w1 = workout('2026-09-01', reps(30, [15, 15, 15]))
    const w2 = workout('2026-09-03', reps(35, [10, 10, 10]))
    expect(summarize(w1, [w1, w2], exMap, true)[0].next.kind).toBe('increase')
  })
})

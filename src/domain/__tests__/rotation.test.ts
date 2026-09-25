import { describe, expect, it } from 'vitest'
import { seedPrograms } from '../../data/seed/programs'
import { nextSession } from '../rotation'
import type { Program, WorkoutSession } from '../types'
import { reps, workout } from './helpers'

const [bro, ul] = seedPrograms
const w = (day: string, sessionId: string, programId = 'bro_split') =>
  workout(day, reps(30, [12]), { sessionId, programId })

const next = (program: Program, workouts: WorkoutSession[], today = '2026-09-25', skipped: string | null = null) =>
  nextSession({ program, workouts, today, bonusSkippedWeek: skipped }).name

describe('rotasjon (SPEC 6 / 15)', () => {
  it('ingen historikk → første økt', () => {
    expect(next(bro, [])).toBe('Bryst og skuldre')
  })

  it('bro split: sist Bein → Armer, sist Armer → Bryst og skuldre', () => {
    expect(next(bro, [w('2026-09-20', 'bein')])).toBe('Armer')
    expect(next(bro, [w('2026-09-20', 'bein'), w('2026-09-22', 'armer')])).toBe('Bryst og skuldre')
  })

  it('bare oppvarming eller uavsluttet teller ikke som fullført', () => {
    const warm = workout('2026-09-20', reps(30, [8], { warmup: true }), { sessionId: 'bein' })
    const open = { ...w('2026-09-21', 'bein'), end: null }
    expect(next(bro, [warm, open])).toBe('Bryst og skuldre')
  })

  it('andre programmers økter påvirker ikke', () => {
    expect(next(bro, [w('2026-09-20', 'bein', 'upper_lower')])).toBe('Bryst og skuldre')
  })

  // 2026-09-21 er mandag
  const uke = [
    w('2026-09-21', 'overkropp_a', 'upper_lower'),
    w('2026-09-22', 'bein', 'upper_lower'),
    w('2026-09-24', 'overkropp_b', 'upper_lower'),
  ]

  it('overkropp/underkropp: alle tre kjerneøkter denne uka → bonus', () => {
    expect(next(ul, uke, '2026-09-25')).toBe('Skuldre og armer')
  })

  it('ny uke → neste kjerneøkt', () => {
    expect(next(ul, uke, '2026-09-28')).toBe('Overkropp A')
  })

  it('bonus hoppet over denne uka → neste kjerneøkt', () => {
    expect(next(ul, uke, '2026-09-25', '2026-09-21')).toBe('Overkropp A')
  })

  it('etter bonus: neste kjerneøkt etter sist fullførte kjerneøkt', () => {
    expect(next(ul, [...uke, w('2026-09-25', 'skuldre_armer', 'upper_lower')], '2026-09-26')).toBe('Overkropp A')
  })

  it('kjerneøkter spredt over to uker gir ikke bonus', () => {
    const spredt = [
      w('2026-09-19', 'overkropp_a', 'upper_lower'),
      w('2026-09-22', 'bein', 'upper_lower'),
      w('2026-09-24', 'overkropp_b', 'upper_lower'),
    ]
    expect(next(ul, spredt, '2026-09-25')).toBe('Overkropp A')
  })
})

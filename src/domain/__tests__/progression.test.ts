import { describe, expect, it } from 'vitest'
import { exerciseHistory, MSG_STAGNATION, MSG_TOO_LIGHT, suggest, type SuggestContext } from '../progression'
import { reps, set, workout } from './helpers'

const ctx: SuggestContext = { step: 5, repMin: 10, techniquePhase: false }
const run = (...ws: ReturnType<typeof workout>[]) => suggest(exerciseHistory('chest_press', ws), ctx)

describe('progresjon (SPEC 8 / 15)', () => {
  it('første gang: ingen vekt, be om valg', () => {
    expect(run().kind).toBe('first')
    expect(run().weight).toBeNull()
  })

  it('[15, 15, 15] på 30 kg → 35 kg, mål 10 reps', () => {
    const s = run(workout('2026-09-01', reps(30, [15, 15, 15])))
    expect(s).toMatchObject({ kind: 'increase', weight: 35, targetReps: 10 })
  })

  it('[15, 14, 13] på 30 kg → 30 kg, mål minst 43 totalt, viser forrige reps', () => {
    const s = run(workout('2026-09-01', reps(30, [15, 14, 13])))
    expect(s).toMatchObject({ kind: 'hold', weight: 30, targetTotal: 43, previousReps: [15, 14, 13] })
  })

  it('bare 2 av 3 planlagte sett, begge 15 → ingen økning', () => {
    expect(run(workout('2026-09-01', reps(30, [15, 15]))).kind).toBe('hold')
  })

  it('etter økning til 35 kg: [8, 7, 7] → tilbake til 30 kg', () => {
    const s = run(workout('2026-09-01', reps(30, [15, 15, 15])), workout('2026-09-03', reps(35, [8, 7, 7])))
    expect(s).toMatchObject({ kind: 'tooHeavy', weight: 30 })
  })

  it('snitt nøyaktig repMin − 2 er ikke for tungt', () => {
    const s = run(workout('2026-09-01', reps(30, [15, 15, 15])), workout('2026-09-03', reps(35, [8, 8, 8])))
    expect(s.kind).toBe('hold')
  })

  it('for tungt gjelder bare første økt etter økning', () => {
    const s = run(
      workout('2026-09-01', reps(30, [15, 15, 15])),
      workout('2026-09-03', reps(35, [10, 10, 10])),
      workout('2026-09-05', reps(35, [8, 7, 7])),
    )
    expect(s.kind).toBe('hold')
  })

  it('stagnasjon: 40, 40, 39, 40 → varsel etter tredje økt uten framgang', () => {
    const ws = [workout('2026-09-01', reps(30, [14, 13, 13])), workout('2026-09-03', reps(30, [14, 13, 13]))]
    expect(run(...ws).messages).not.toContain(MSG_STAGNATION)
    ws.push(workout('2026-09-05', reps(30, [13, 13, 13])))
    expect(run(...ws).messages).not.toContain(MSG_STAGNATION)
    ws.push(workout('2026-09-07', reps(30, [14, 13, 13])))
    const s = run(...ws)
    expect(s.messages).toContain(MSG_STAGNATION)
    expect(s.kind).toBe('hold')
  })

  it('fem økter uten framgang → ca. 10 % lavere vekt, bare én gang', () => {
    const ws = [workout('2026-09-01', reps(30, [14, 13, 13]))]
    for (let i = 0; i < 5; i++) ws.push(workout(`2026-09-1${i}`, reps(30, [14, 13, 13])))
    expect(run(...ws)).toMatchObject({ kind: 'deload', weight: 25 })
    ws.push(workout('2026-09-20', reps(30, [14, 13, 13])))
    expect(run(...ws).kind).toBe('hold')
  })

  it('første økt på ny lavere vekt nullstiller stagnasjon', () => {
    const ws = [workout('2026-09-01', reps(30, [14, 13, 13]))]
    for (let i = 0; i < 3; i++) ws.push(workout(`2026-09-1${i}`, reps(30, [14, 13, 13])))
    ws.push(workout('2026-09-15', reps(25, [14, 13, 13])))
    expect(run(...ws).messages).not.toContain(MSG_STAGNATION)
  })

  it('oppvarmingssett påvirker ikke forslaget', () => {
    const sets = [set(15, 8, { warmup: true }), set(25, 4, { warmup: true }), ...reps(30, [15, 15, 15])]
    expect(run(workout('2026-09-01', sets))).toMatchObject({ kind: 'increase', weight: 35 })
  })

  it('sett med dårlig form påvirker ikke arbeidsvekt eller total', () => {
    const sets = [set(40, 5, { goodForm: false }), ...reps(30, [15, 14, 13]), set(30, 4, { goodForm: false })]
    expect(run(workout('2026-09-01', sets))).toMatchObject({ kind: 'hold', weight: 30, targetTotal: 43 })
  })

  it('dårlig form på et av de planlagte settene → ikke gjennomført, ingen økning', () => {
    const sets = [...reps(30, [15, 15]), set(30, 15, { goodForm: false })]
    expect(run(workout('2026-09-01', sets)).kind).toBe('hold')
  })

  it('sett på annen vekt teller ikke som gjennomført', () => {
    const sets = [...reps(30, [15, 15]), set(25, 15)]
    expect(run(workout('2026-09-01', sets)).kind).toBe('hold')
  })

  it('ekstra sett utover plan: bare de første N teller', () => {
    const s = run(workout('2026-09-01', reps(30, [15, 15, 15, 9])))
    expect(s).toMatchObject({ kind: 'increase', previousReps: [15, 15, 15] })
  })

  it('bruker planen fra forrige gang (4 sett planlagt, 3 gjort → ingen økning)', () => {
    expect(run(workout('2026-09-01', reps(30, [15, 15, 15]), { plannedSets: 4 })).kind).toBe('hold')
  })

  it('snitt-RIR 3+ etter teknikkfasen → for lett-melding; i teknikkfasen: ingen', () => {
    const w = workout('2026-09-01', reps(30, [12, 12, 12], { rir: 3 }))
    expect(run(w).messages).toContain(MSG_TOO_LIGHT)
    const tech = suggest(exerciseHistory('chest_press', [w]), { ...ctx, techniquePhase: true })
    expect(tech.messages).not.toContain(MSG_TOO_LIGHT)
  })

  it('ingen RIR logget eller snitt under 3 → ingen for lett-melding', () => {
    expect(run(workout('2026-09-01', reps(30, [12, 12, 12]))).messages).not.toContain(MSG_TOO_LIGHT)
    const mixed = [set(30, 12, { rir: 4 }), set(30, 12, { rir: 2 }), set(30, 12, { rir: 2 })]
    expect(run(workout('2026-09-01', mixed)).messages).not.toContain(MSG_TOO_LIGHT)
  })

  it('steg 2,5 gir riktig desimalvekt', () => {
    const h = exerciseHistory('chest_press', [workout('2026-09-01', reps(12.5, [15, 15, 15]))])
    expect(suggest(h, { ...ctx, step: 2.5 }).weight).toBe(15)
  })

  it('uavsluttede økter ignoreres', () => {
    const w = { ...workout('2026-09-01', reps(30, [15, 15, 15])), end: null }
    expect(run(w).kind).toBe('first')
  })
})

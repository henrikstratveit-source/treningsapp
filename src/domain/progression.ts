// Progresjonsregler (SPEC 8) med avklaringene i PLAN.md (spørsmål 4–11).
import { roundToStep } from './rounding'
import type { SetEntry, WorkoutSession } from './types'

/** Én gang en øvelse ble gjort: settene og planen slik den var da. */
export interface Performance {
  workoutId: string
  /** ISO-starttidspunkt for økta */
  start: string
  plannedSets: number
  repMin: number
  repMax: number
  entries: SetEntry[]
}

/** Gyldig arbeidssett: ikke oppvarming og god form. */
export const isValidWorkSet = (s: SetEntry) => !s.warmup && s.goodForm

/**
 * Historikk for én øvelse fra avsluttede økter, eldste først.
 * Tar bare med økter der øvelsen har minst ett gyldig arbeidssett.
 */
export function exerciseHistory(exerciseId: string, workouts: WorkoutSession[]): Performance[] {
  return workouts
    .filter((w) => w.end !== null)
    .sort((a, b) => a.start.localeCompare(b.start))
    .flatMap((w) => {
      const entries = w.sets.filter((s) => s.exerciseId === exerciseId)
      if (!entries.some(isValidWorkSet)) return []
      const plan = w.plan.find((p) => p.slotIndex === entries[0].slotIndex)
      const counted = entries.filter((s) => !s.warmup).length
      return [
        {
          workoutId: w.id,
          start: w.start,
          plannedSets: plan?.sets ?? counted,
          repMin: plan?.repMin ?? 0,
          repMax: plan?.repMax ?? 0,
          entries,
        },
      ]
    })
}

export interface Analysis {
  /** Arbeidsvekt = vekta på første gyldige arbeidssett */
  weight: number
  /** Reps i settene som teller: gyldige, på arbeidsvekta, maks antall planlagte */
  reps: number[]
  total: number
  /** Alle planlagte sett gjennomført og alle nådde repMax */
  allAtMax: boolean
}

export function analyze(p: Performance): Analysis {
  const valid = p.entries.filter(isValidWorkSet)
  const weight = valid[0].weight
  const reps = valid
    .filter((s) => s.weight === weight)
    .slice(0, p.plannedSets)
    .map((s) => s.reps)
  const total = reps.reduce((a, b) => a + b, 0)
  const allAtMax = reps.length >= p.plannedSets && reps.every((r) => r >= p.repMax)
  return { weight, reps, total, allAtMax }
}

/** Antall økter på rad (til og med siste) uten framgang (regel 5, svar 8). */
export function stagnationStreak(history: Performance[]): number {
  const a = history.map(analyze)
  let streak = 0
  for (let i = 1; i < a.length; i++) {
    const cur = a[i]
    let progress: boolean
    if (cur.weight !== a[i - 1].weight) {
      // Ny vekt (høyere, eller første økt på ny lavere vekt) teller som framgang.
      progress = true
    } else {
      const best = Math.max(...a.slice(0, i).filter((x) => x.weight === cur.weight).map((x) => x.total))
      progress = cur.total > best
    }
    streak = progress ? 0 : streak + 1
  }
  return streak
}

export type SuggestionKind = 'first' | 'tooHeavy' | 'deload' | 'increase' | 'hold'

export interface Suggestion {
  kind: SuggestionKind
  /** Foreslått vekt; null når det er første gang (regel 1) */
  weight: number | null
  /** Mål-reps per sett (økning, for tungt, deload) */
  targetReps: number | null
  /** Mål for totalt antall reps (hold) */
  targetTotal: number | null
  /** Reps per sett forrige gang (for forhåndsutfylling og visning) */
  previousReps: number[]
  previousWeight: number | null
  /** Ekstra meldinger (stagnasjon, for lett) */
  messages: string[]
}

export const MSG_FIRST =
  'Første gang: velg en vekt du tror du klarer i øvre del av rep-området med 2–3 reps igjen.'
export const MSG_STAGNATION = 'Står stille. Sjekk søvn og mat.'
export const MSG_TOO_LIGHT = 'Du stopper langt unna failure. Ta flere reps eller øk vekta.'

export interface SuggestContext {
  step: number
  /** Rep-området i dagens plan (brukes for mål-reps) */
  repMin: number
  /** true = teknikkfase, regel 6 skrus av */
  techniquePhase: boolean
}

/** Forslag for neste gang øvelsen gjøres. Prioritet: 4 > 5 (−10 %) > 2 > 3 (svar 9). */
export function suggest(history: Performance[], ctx: SuggestContext): Suggestion {
  if (history.length === 0) {
    return {
      kind: 'first',
      weight: null,
      targetReps: null,
      targetTotal: null,
      previousReps: [],
      previousWeight: null,
      messages: [MSG_FIRST],
    }
  }

  const last = history[history.length - 1]
  const a = analyze(last)
  const base = { previousReps: a.reps, previousWeight: a.weight, targetTotal: null }
  const messages: string[] = []

  const streak = stagnationStreak(history)
  if (streak >= 3) messages.push(MSG_STAGNATION)

  // Regel 6: snitt-RIR av arbeidssett med RIR logget (svar 10).
  if (!ctx.techniquePhase) {
    const rirs = last.entries.filter((s) => isValidWorkSet(s) && s.rir !== null).map((s): number => s.rir!)
    if (rirs.length > 0 && rirs.reduce((x, y) => x + y, 0) / rirs.length >= 3) messages.push(MSG_TOO_LIGHT)
  }

  // Regel 4: første økt etter en økning, snitt mer enn 2 under repMin (svar 7).
  if (history.length >= 2) {
    const prev = analyze(history[history.length - 2])
    const avg = a.total / a.reps.length
    if (a.weight > prev.weight && avg < last.repMin - 2) {
      return { ...base, kind: 'tooHeavy', weight: prev.weight, targetReps: ctx.repMin, messages }
    }
  }

  // Regel 5: fem økter uten framgang → ca. 10 % lavere, vises én gang (svar 8).
  if (streak === 5) {
    return { ...base, kind: 'deload', weight: roundToStep(a.weight * 0.9, ctx.step), targetReps: ctx.repMin, messages }
  }

  // Regel 2: øk.
  if (a.allAtMax) {
    return { ...base, kind: 'increase', weight: Math.round((a.weight + ctx.step) * 100) / 100, targetReps: ctx.repMin, messages }
  }

  // Regel 3: hold, slå forrige total med minst én rep.
  return { ...base, kind: 'hold', weight: a.weight, targetReps: null, targetTotal: a.total + 1, messages }
}

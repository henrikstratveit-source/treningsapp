// Statistikk (SPEC 11, svar 19–21).
import { addDays, localDate, mondayOf } from './dates'
import { exerciseHistory, isValidWorkSet } from './progression'
import { epley } from './rounding'
import { isCompleted } from './rotation'
import type { Exercise, Muscle, WorkoutSession } from './types'

export const PRIORITY_MUSCLE: Muscle = 'sideskulder'

export const ALL_MUSCLES: Muscle[] = [
  'bryst',
  'fremre skulder',
  'sideskulder',
  'bakre skulder',
  'rygg',
  'biceps',
  'triceps',
  'framside lår',
  'baklår',
  'sete',
  'legger',
]

const weekOf = (w: WorkoutSession) => mondayOf(localDate(w.start))

/** Harde sett per muskel for én uke. Alle arbeidssett teller, også dårlig form (svar 19). */
export function hardSetsForWeek(
  workouts: WorkoutSession[],
  exercises: Map<string, Exercise>,
  weekMonday: string,
): Map<Muscle, number> {
  const res = new Map<Muscle, number>()
  for (const w of workouts) {
    if (!isCompleted(w) || weekOf(w) !== weekMonday) continue
    for (const s of w.sets) {
      if (s.warmup) continue
      for (const m of exercises.get(s.exerciseId)?.muscles ?? []) res.set(m.muscle, (res.get(m.muscle) ?? 0) + m.share)
    }
  }
  return res
}

/**
 * De siste n fulle ukene (mandager, nyeste sist) som ligger fra og med uka for første fullførte økt.
 * «Uker med data» = uker etter at du begynte å logge, også uker uten økter (svar 21).
 */
export function fullWeeksWithData(workouts: WorkoutSession[], today: string, n: number): string[] {
  const done = workouts.filter(isCompleted)
  if (done.length === 0) return []
  const first = done.map(weekOf).sort()[0]
  const current = mondayOf(today)
  const weeks: string[] = []
  for (let w = addDays(current, -7); w >= first && weeks.length < n; w = addDays(w, -7)) weeks.unshift(w)
  return weeks
}

/** Snitt harde sett per muskel over de siste 4 fulle ukene med data. */
export function hardSetsAverage(
  workouts: WorkoutSession[],
  exercises: Map<string, Exercise>,
  today: string,
  n = 4,
): Map<Muscle, number> {
  const weeks = fullWeeksWithData(workouts, today, n)
  const res = new Map<Muscle, number>()
  if (weeks.length === 0) return res
  for (const w of weeks)
    for (const [m, v] of hardSetsForWeek(workouts, exercises, w)) res.set(m, (res.get(m) ?? 0) + v)
  for (const [m, v] of res) res.set(m, v / weeks.length)
  return res
}

/** Snitt fullførte økter per uke over de siste n fulle ukene med data; null uten data. */
export function sessionsPerWeek(workouts: WorkoutSession[], today: string, n: number): number | null {
  const weeks = fullWeeksWithData(workouts, today, n)
  if (weeks.length === 0) return null
  const set = new Set(weeks)
  return workouts.filter((w) => isCompleted(w) && set.has(weekOf(w))).length / weeks.length
}

/** Programforslag: bro split, minst 4 fulle uker med data og 6-ukers snitt under 3,5. */
export function programSuggestion(activeProgramId: string, workouts: WorkoutSession[], today: string): string | null {
  if (activeProgramId !== 'bro_split') return null
  if (fullWeeksWithData(workouts, today, 6).length < 4) return null
  const avg = sessionsPerWeek(workouts, today, 6)!
  if (avg >= 3.5) return null
  const x = (Math.round(avg * 10) / 10).toString().replace('.', ',')
  return `Du trener i snitt ${x} ganger i uka. Med tre økter i uka får hver muskel mindre volum i bro splitten. Vurder overkropp/underkropp.`
}

export interface ProgressPoint {
  date: string
  weight: number
  reps: number[]
  total: number
  e1rm: number
}

/** Arbeidsvekt, reps og beste estimerte 1RM per gang øvelsen er gjort. */
export function exerciseProgress(exerciseId: string, workouts: WorkoutSession[]): ProgressPoint[] {
  return exerciseHistory(exerciseId, workouts).map((p) => {
    const valid = p.entries.filter(isValidWorkSet)
    const weight = valid[0].weight
    const reps = valid.filter((s) => s.weight === weight).map((s) => s.reps)
    return {
      date: localDate(p.start),
      weight,
      reps,
      total: reps.reduce((a, b) => a + b, 0),
      e1rm: Math.round(Math.max(...valid.map((s) => epley(s.weight, s.reps))) * 10) / 10,
    }
  })
}

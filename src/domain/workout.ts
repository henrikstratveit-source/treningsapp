// Hjelpere for en økt: plan-snapshot og sammendrag etter økta (SPEC 8 regel 7).
import { exerciseHistory, isValidWorkSet, suggest, type Suggestion } from './progression'
import { records, type RecordResult } from './records'
import type { Exercise, PlannedSlot, ProgramSession, WorkoutSession } from './types'

export function buildPlan(session: ProgramSession): PlannedSlot[] {
  return session.slots.map((s, slotIndex) => ({
    slotIndex,
    exerciseId: s.exerciseId,
    sets: s.sets,
    repMin: s.repMin,
    repMax: s.repMax,
  }))
}

export interface SlotProgress {
  /** Loggede arbeidssett for øvelsen som står på plassen nå */
  logged: number
  /** Antall sett-rader: planlagt + ekstra, men aldri færre enn logget */
  rows: number
  done: boolean
}

/** Hvor langt en plass i økta har kommet. `extra` = sett lagt til (+) eller fjernet (−) i økta. */
export function slotProgress(workout: WorkoutSession, slot: PlannedSlot, extra = 0): SlotProgress {
  const logged = workout.sets.filter(
    (s) => s.slotIndex === slot.slotIndex && s.exerciseId === slot.exerciseId && !s.warmup,
  ).length
  const rows = Math.max(slot.sets + extra, logged, 1)
  return { logged, rows, done: logged >= rows }
}

/** Plassen som skal ha fokus: første uferdige etter `after`, ellers første uferdige, ellers null. */
export function nextOpenSlot(
  workout: WorkoutSession,
  extras: Record<number, number>,
  after = -1,
): number | null {
  const open = workout.plan.filter((p) => !slotProgress(workout, p, extras[p.slotIndex] ?? 0).done)
  return (open.find((p) => p.slotIndex > after) ?? open[0])?.slotIndex ?? null
}

/** Manualøvelser logges per manual (SPEC 2). */
export const isDumbbell = (exerciseId: string) => /(^|_)db(_|$)/.test(exerciseId)

export interface SummaryItem {
  exerciseId: string
  weight: number
  reps: number[]
  next: Suggestion
  record: RecordResult | null
}

/** Sammendrag for en avsluttet økt: hva som skjer neste gang og eventuelle rekorder. */
export function summarize(
  workout: WorkoutSession,
  allWorkouts: WorkoutSession[],
  exercises: Map<string, Exercise>,
  techniquePhase: boolean,
): SummaryItem[] {
  // Historikk frem til og med denne økta.
  const upTo = allWorkouts.filter((w) => w.start <= workout.start && w.end !== null)
  const ids = [...new Set(workout.sets.filter(isValidWorkSet).map((s) => s.exerciseId))]
  return ids.flatMap((id) => {
    const ex = exercises.get(id)
    if (!ex) return []
    const history = exerciseHistory(id, upTo)
    const last = history[history.length - 1]
    if (!last || last.workoutId !== workout.id) return []
    const slot = workout.plan.find((p) => p.exerciseId === id)
    const next = suggest(history, { step: ex.step, repMin: slot?.repMin ?? last.repMin, techniquePhase })
    const work = last.entries.filter(isValidWorkSet)
    return [{ exerciseId: id, weight: work[0].weight, reps: work.map((s) => s.reps), next, record: records(history) }]
  })
}

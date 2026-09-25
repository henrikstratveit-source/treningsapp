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

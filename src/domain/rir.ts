// Innsats og teknikkfase (SPEC 7, svar 13).
import { daysBetween } from './dates'
import type { ExerciseType } from './types'

export interface RirTarget {
  min: number
  max: number
}

/** Teknikkfase: dag 1–14 fra første loggede økt, begge inkludert. */
export function inTechniquePhase(enabled: boolean, firstWorkoutDate: string | null, today: string): boolean {
  if (!enabled) return false
  if (firstWorkoutDate === null) return true
  return daysBetween(firstWorkoutDate, today) <= 13
}

/** Mål-RIR for et arbeidssett. setNumber starter på 1. */
export function targetRir(type: ExerciseType, setNumber: number, totalSets: number, technique: boolean): RirTarget {
  if (technique) return { min: 2, max: 3 }
  if (type === 'isolasjon' && setNumber === totalSets) return { min: 0, max: 0 }
  return { min: 1, max: 2 }
}

export function formatRir(t: RirTarget): string {
  return t.min === t.max ? `RIR ${t.min}` : `RIR ${t.min}–${t.max}`
}

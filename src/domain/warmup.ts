// Oppvarming (SPEC 7).
import { roundToStep } from './rounding'
import type { ExerciseType } from './types'

export interface WarmupSet {
  weight: number
  reps: number
}

/**
 * Første flerleddsøvelse i økta: ~50 % × 8 og ~75 % × 4. Senere flerledd: ~60 % × 6.
 * Isolasjon eller ukjent arbeidsvekt: ingen.
 */
export function warmupSets(
  type: ExerciseType,
  workWeight: number | null,
  step: number,
  firstCompound: boolean,
): WarmupSet[] {
  if (type !== 'flerledd' || workWeight === null || workWeight <= 0) return []
  const w = (pct: number) => roundToStep(workWeight * pct, step)
  return firstCompound
    ? [
        { weight: w(0.5), reps: 8 },
        { weight: w(0.75), reps: 4 },
      ]
    : [{ weight: w(0.6), reps: 6 }]
}

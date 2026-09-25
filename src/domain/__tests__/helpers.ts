import type { SetEntry, WorkoutSession } from '../types'

let n = 0

export function set(weight: number, reps: number, extra: Partial<SetEntry> = {}): SetEntry {
  n++
  return {
    id: `s${n}`,
    exerciseId: 'chest_press',
    slotIndex: 0,
    setNumber: 1,
    weight,
    reps,
    rir: null,
    warmup: false,
    goodForm: true,
    time: '2026-09-01T10:00:00',
    ...extra,
  }
}

/** Avsluttet økt med én øvelse (standard: chest_press 3 × 10–15). */
export function workout(
  day: string,
  sets: SetEntry[],
  opts: { sessionId?: string; programId?: string; plannedSets?: number; repMin?: number; repMax?: number } = {},
): WorkoutSession {
  n++
  return {
    id: `w${n}`,
    programId: opts.programId ?? 'bro_split',
    sessionId: opts.sessionId ?? 'bryst_skuldre',
    start: `${day}T10:00:00`,
    end: `${day}T10:40:00`,
    plan: [
      {
        slotIndex: 0,
        exerciseId: sets[0]?.exerciseId ?? 'chest_press',
        sets: opts.plannedSets ?? 3,
        repMin: opts.repMin ?? 10,
        repMax: opts.repMax ?? 15,
      },
    ],
    sets,
  }
}

export const reps = (weight: number, rs: number[], extra: Partial<SetEntry> = {}) =>
  rs.map((r, i) => set(weight, r, { setNumber: i + 1, ...extra }))

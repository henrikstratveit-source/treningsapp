// Datamodell. Feltnavn er på engelsk i koden; se PLAN.md for kobling mot spesifikasjonen.

export type ExerciseType = 'flerledd' | 'isolasjon'

export type Muscle =
  | 'bryst'
  | 'fremre skulder'
  | 'sideskulder'
  | 'bakre skulder'
  | 'rygg'
  | 'biceps'
  | 'triceps'
  | 'framside lår'
  | 'baklår'
  | 'sete'
  | 'legger'

export interface MuscleShare {
  muscle: Muscle
  share: 1 | 0.5
}

export interface Exercise {
  id: string
  name: string
  type: ExerciseType
  /** Økningssteg i kg */
  step: number
  /** Pausetid i sekunder */
  rest: number
  muscles: MuscleShare[]
}

export interface Slot {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  optional: boolean
  alternatives: string[]
}

export interface ProgramSession {
  id: string
  name: string
  bonus: boolean
  slots: Slot[]
}

export interface Program {
  id: string
  name: string
  sessions: ProgramSession[]
  builtIn: boolean
}

/** Snapshot av planen for én plass i økta, slik den var da økta ble gjort. */
export interface PlannedSlot {
  slotIndex: number
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
}

/** 4 betyr «4+» */
export type Rir = 0 | 1 | 2 | 3 | 4

export interface SetEntry {
  id: string
  exerciseId: string
  slotIndex: number
  setNumber: number
  weight: number
  reps: number
  rir: Rir | null
  warmup: boolean
  goodForm: boolean
  /** ISO-tidspunkt */
  time: string
}

export interface WorkoutSession {
  id: string
  programId: string
  sessionId: string
  /** ISO-tidspunkt */
  start: string
  end: string | null
  plan: PlannedSlot[]
  sets: SetEntry[]
}

export interface BodyweightEntry {
  /** 'YYYY-MM-DD' lokal dato, primærnøkkel */
  date: string
  kg: number
}

export interface Settings {
  id: 'settings'
  activeProgramId: string
  startWeight: number
  goalWeight: number
  /** 'YYYY-MM-DD', settes ved første loggede økt */
  firstWorkoutDate: string | null
  techniquePhase: boolean
  /** Globale standard-pausetider (sekunder) */
  restCompound: number
  restIsolation: number
  /** kg per uke, null = ikke satt */
  targetRate: number | null
  /** ISO-tidspunkt */
  lastExport: string | null
  /** Mandag ('YYYY-MM-DD') i uka der bonusøkta ble hoppet over */
  bonusSkippedWeek: string | null
  /** Aktiv pausetimer, lagret som tidsstempel */
  activeRest: { start: string; seconds: number } | null
  /** Start iPhone-timer (Dynamic Island) via Snarveier når et sett lagres. Mangler i eldre data. */
  shortcutTimer?: boolean
  /** Navnet på snarveien som starter timeren */
  shortcutName?: string
  /** Utseende. Mangler i eldre data = 'ny'. */
  theme?: Theme
}

export type Theme = 'ny' | 'klassisk'

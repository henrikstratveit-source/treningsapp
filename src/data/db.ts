import Dexie, { type EntityTable } from 'dexie'
import type { BodyweightEntry, Exercise, Program, Settings, WorkoutSession } from '../domain/types'
import { seedExercises } from './seed/exercises'
import { BRO_SPLIT_ID, seedPrograms } from './seed/programs'

export class TrainingDb extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  programs!: EntityTable<Program, 'id'>
  workouts!: EntityTable<WorkoutSession, 'id'>
  bodyweight!: EntityTable<BodyweightEntry, 'date'>
  settings!: EntityTable<Settings, 'id'>

  constructor(name = 'treningsapp') {
    super(name)
    this.version(1).stores({
      exercises: 'id',
      programs: 'id',
      workouts: 'id, start, programId',
      bodyweight: 'date',
      settings: 'id',
    })
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(seedExercises)
      tx.table('programs').bulkAdd(seedPrograms)
      tx.table('settings').add(defaultSettings())
    })
  }
}

export function defaultSettings(): Settings {
  return {
    id: 'settings',
    activeProgramId: BRO_SPLIT_ID,
    startWeight: 70,
    goalWeight: 75,
    firstWorkoutDate: null,
    techniquePhase: true,
    restCompound: 120,
    restIsolation: 75,
    targetRate: null,
    lastExport: null,
    bonusSkippedWeek: null,
    activeRest: null,
  }
}

export const db = new TrainingDb()

/** Be nettleseren om varig lagring (SPEC 2). */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

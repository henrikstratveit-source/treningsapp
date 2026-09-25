// Skriveoperasjoner mot databasen. Alt lagres fortløpende.
import { localDate } from '../domain/dates'
import type { ProgramSession, SetEntry } from '../domain/types'
import { buildPlan } from '../domain/workout'
import { db } from './db'

// randomUUID finnes bare i sikre kontekster (https/localhost), ikke på http://192.168…
export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export async function startWorkout(programId: string, session: ProgramSession): Promise<string> {
  const id = newId()
  await db.workouts.add({
    id,
    programId,
    sessionId: session.id,
    start: new Date().toISOString(),
    end: null,
    plan: buildPlan(session),
    sets: [],
  })
  return id
}

export async function getActiveWorkout() {
  return (await db.workouts.toArray()).find((w) => w.end === null)
}

/** Legg til eller oppdater et sett. Setter dato for første økt ved første arbeidssett. */
export async function saveSet(workoutId: string, entry: SetEntry) {
  await db.transaction('rw', db.workouts, db.settings, async () => {
    await db.workouts
      .where('id')
      .equals(workoutId)
      .modify((w) => {
        const i = w.sets.findIndex((s) => s.id === entry.id)
        if (i >= 0) w.sets[i] = entry
        else w.sets.push(entry)
      })
    if (!entry.warmup) {
      const s = await db.settings.get('settings')
      if (s && !s.firstWorkoutDate) await db.settings.update('settings', { firstWorkoutDate: localDate(new Date()) })
    }
  })
}

export async function deleteSet(workoutId: string, setId: string) {
  await db.workouts
    .where('id')
    .equals(workoutId)
    .modify((w) => {
      w.sets = w.sets.filter((s) => s.id !== setId)
    })
}

/** Bytt øvelse på en plass i økta (f.eks. når maskinen er opptatt). */
export async function swapExercise(workoutId: string, slotIndex: number, exerciseId: string) {
  await db.workouts
    .where('id')
    .equals(workoutId)
    .modify((w) => {
      const p = w.plan.find((x) => x.slotIndex === slotIndex)
      if (p) p.exerciseId = exerciseId
    })
}

export async function finishWorkout(workoutId: string) {
  await db.workouts.update(workoutId, { end: new Date().toISOString() })
  await clearRest()
}

export async function discardWorkout(workoutId: string) {
  await db.workouts.delete(workoutId)
  await clearRest()
}

export async function startRest(seconds: number) {
  await db.settings.update('settings', { activeRest: { start: new Date().toISOString(), seconds } })
}

export async function extendRest(extra: number) {
  const s = await db.settings.get('settings')
  if (s?.activeRest) await db.settings.update('settings', { activeRest: { ...s.activeRest, seconds: s.activeRest.seconds + extra } })
}

export async function clearRest() {
  await db.settings.update('settings', { activeRest: null })
}

export async function skipBonus(weekMonday: string) {
  await db.settings.update('settings', { bonusSkippedWeek: weekMonday })
}

/** Én vekt per dag; ny registrering samme dag overskriver (SPEC 10). */
export async function setBodyweight(date: string, kg: number) {
  await db.bodyweight.put({ date, kg })
}

export async function deleteBodyweight(date: string) {
  await db.bodyweight.delete(date)
}

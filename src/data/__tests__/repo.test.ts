import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// repo.ts bruker den delte db-instansen; gi den en fersk database per test.
vi.mock('../db', async (orig) => {
  const mod = await orig<typeof import('../db')>()
  return { ...mod, db: new mod.TrainingDb('repo-test') }
})

const { db } = await import('../db')
const repo = await import('../repo')
const { seedPrograms } = await import('../seed/programs')

const entry = (warmup = false) => ({
  id: repo.newId(),
  exerciseId: 'chest_press',
  slotIndex: 0,
  setNumber: 1,
  weight: 30,
  reps: 12,
  rir: null,
  warmup,
  goodForm: true,
  time: new Date().toISOString(),
})

describe('repo', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('start, logg sett, avslutt', async () => {
    const id = await repo.startWorkout('bro_split', seedPrograms[0].sessions[0])
    expect((await repo.getActiveWorkout())?.id).toBe(id)

    await repo.saveSet(id, entry(true))
    expect((await db.settings.get('settings'))?.firstWorkoutDate).toBeNull()

    const e = entry()
    await repo.saveSet(id, e)
    expect((await db.settings.get('settings'))?.firstWorkoutDate).not.toBeNull()

    await repo.saveSet(id, { ...e, reps: 14 })
    const w = await db.workouts.get(id)
    expect(w?.sets).toHaveLength(2)
    expect(w?.sets[1].reps).toBe(14)

    await repo.finishWorkout(id)
    expect(await repo.getActiveWorkout()).toBeUndefined()
  })

  it('bytt øvelse endrer plan-snapshot', async () => {
    const id = await repo.startWorkout('bro_split', seedPrograms[0].sessions[0])
    await repo.swapExercise(id, 4, 'lateral_cable')
    expect((await db.workouts.get(id))?.plan[4].exerciseId).toBe('lateral_cable')
  })

  it('global pausetid endrer bare øvelser som fulgte den gamle verdien', async () => {
    await db.exercises.update('leg_press', { rest: 150 })
    await repo.setGlobalRest('flerledd', 90)
    expect((await db.exercises.get('chest_press'))?.rest).toBe(90)
    expect((await db.exercises.get('leg_press'))?.rest).toBe(150)
    expect((await db.exercises.get('flyes'))?.rest).toBe(75)
    expect((await db.settings.get('settings'))?.restCompound).toBe(90)
  })

  it('tilbakestill til standard beholder egne programmer', async () => {
    await db.programs.update('bro_split', { name: 'Endret' })
    await db.programs.add({ id: 'mitt', name: 'Mitt', builtIn: false, sessions: [] })
    await repo.resetDefaults()
    expect((await db.programs.get('bro_split'))?.name).toBe('Bro split')
    expect(await db.programs.get('mitt')).toBeDefined()
  })

  it('pausetimer lagres som tidsstempel og kan forlenges', async () => {
    await repo.startRest(75)
    await repo.extendRest(30)
    expect((await db.settings.get('settings'))?.activeRest?.seconds).toBe(105)
    await repo.clearRest()
    expect((await db.settings.get('settings'))?.activeRest).toBeNull()
  })
})

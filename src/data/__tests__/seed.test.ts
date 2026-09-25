import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { seedExercises } from '../seed/exercises'
import { seedPrograms } from '../seed/programs'
import { TrainingDb } from '../db'

describe('seed-data', () => {
  it('har 21 øvelser med unike id-er', () => {
    expect(seedExercises).toHaveLength(21)
    expect(new Set(seedExercises.map((e) => e.id)).size).toBe(21)
  })

  it('alle øvelser og alternativer i programmene finnes i biblioteket', () => {
    const ids = new Set(seedExercises.map((e) => e.id))
    for (const p of seedPrograms)
      for (const s of p.sessions)
        for (const sl of s.slots) {
          expect(ids.has(sl.exerciseId), sl.exerciseId).toBe(true)
          for (const a of sl.alternatives) expect(ids.has(a), a).toBe(true)
        }
  })

  it('rep-områder: 12–20 for sidehev, omvendt pec deck og tåhev, ellers 10–15', () => {
    const high = new Set(['lateral_db', 'lateral_cable', 'reverse_pec_deck', 'calf_raise_standing'])
    for (const p of seedPrograms)
      for (const s of p.sessions)
        for (const sl of s.slots)
          expect([sl.repMin, sl.repMax]).toEqual(high.has(sl.exerciseId) ? [12, 20] : [10, 15])
  })

  it('bro split har 4 økter, overkropp/underkropp 3 kjerne + 1 bonus', () => {
    const [bro, ul] = seedPrograms
    expect(bro.sessions.map((s) => s.name)).toEqual(['Bryst og skuldre', 'Rygg', 'Bein', 'Armer'])
    expect(ul.sessions.filter((s) => !s.bonus)).toHaveLength(3)
    expect(ul.sessions.filter((s) => s.bonus).map((s) => s.name)).toEqual(['Skuldre og armer'])
  })

  it('databasen fylles med seed og standardinnstillinger', async () => {
    const db = new TrainingDb('test-' + Math.random())
    await db.open()
    expect(await db.exercises.count()).toBe(21)
    expect(await db.programs.count()).toBe(2)
    const s = await db.settings.get('settings')
    expect(s).toMatchObject({ activeProgramId: 'bro_split', startWeight: 70, goalWeight: 75, techniquePhase: true })
    db.close()
  })
})

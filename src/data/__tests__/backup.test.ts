import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../db', async (orig) => {
  const mod = await orig<typeof import('../db')>()
  return { ...mod, db: new mod.TrainingDb('backup-test') }
})

const { db } = await import('../db')
const { buildBackup, parseBackup, restoreBackup, bodyweightCsv, daysSinceExport } = await import('../backup')

describe('backup', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('eksport → import gir samme data, og import erstatter alt', async () => {
    await db.bodyweight.put({ date: '2026-09-01', kg: 68.2 })
    const text = JSON.stringify(await buildBackup(new Date('2026-09-25T12:00:00Z')))

    await db.bodyweight.put({ date: '2026-09-02', kg: 99 })
    await db.programs.delete('upper_lower')

    await restoreBackup(parseBackup(text))
    expect(await db.bodyweight.toArray()).toEqual([{ date: '2026-09-01', kg: 68.2 }])
    expect(await db.programs.count()).toBe(2)
    expect((await db.settings.get('settings'))?.lastExport).toBe('2026-09-25T12:00:00.000Z')
  })

  it('ugyldige filer avvises med forklaring', () => {
    expect(() => parseBackup('ikke json')).toThrow('ikke gyldig JSON')
    expect(() => parseBackup('{"app":"noe annet"}')).toThrow('ikke en backup')
    expect(() => parseBackup('{"app":"treningsapp","version":1,"exercises":[]}')).toThrow('mangler')
  })

  it('CSV bruker semikolon og desimalkomma', () => {
    const csv = bodyweightCsv([{ date: '2026-09-01', kg: 68.2 }])
    expect(csv.replace('﻿', '')).toBe('dato;kg\n2026-09-01;68,2')
  })

  it('dager siden eksport', () => {
    expect(daysSinceExport(null)).toBeNull()
    expect(daysSinceExport('2026-09-10T08:00:00Z', new Date('2026-09-25T09:00:00Z'))).toBe(15)
  })
})

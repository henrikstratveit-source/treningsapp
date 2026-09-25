// Eksport/import (SPEC 13). Import erstatter alt etter bekreftelse (svar 23).
import { localDate } from '../domain/dates'
import type { BodyweightEntry, Exercise, Program, Settings, WorkoutSession } from '../domain/types'
import { db } from './db'

export interface Backup {
  app: 'treningsapp'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  programs: Program[]
  workouts: WorkoutSession[]
  bodyweight: BodyweightEntry[]
  settings: Settings
}

export async function buildBackup(now = new Date()): Promise<Backup> {
  const [exercises, programs, workouts, bodyweight, settings] = await Promise.all([
    db.exercises.toArray(),
    db.programs.toArray(),
    db.workouts.toArray(),
    db.bodyweight.toArray(),
    db.settings.get('settings'),
  ])
  return {
    app: 'treningsapp',
    version: 1,
    exportedAt: now.toISOString(),
    exercises,
    programs,
    workouts,
    bodyweight,
    settings: { ...settings!, lastExport: now.toISOString(), activeRest: null },
  }
}

/** Sjekker at teksten er en gyldig backup. Kaster feil med norsk melding ellers. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Fila er ikke gyldig JSON.')
  }
  const b = data as Partial<Backup>
  if (b?.app !== 'treningsapp' || b.version !== 1) throw new Error('Fila er ikke en backup fra denne appen.')
  for (const k of ['exercises', 'programs', 'workouts', 'bodyweight'] as const)
    if (!Array.isArray(b[k])) throw new Error(`Backupen mangler «${k}».`)
  if (!b.settings || b.settings.id !== 'settings') throw new Error('Backupen mangler innstillinger.')
  return b as Backup
}

/** Erstatter alle data med backupen. */
export async function restoreBackup(b: Backup) {
  await db.transaction('rw', [db.exercises, db.programs, db.workouts, db.bodyweight, db.settings], async () => {
    await Promise.all([db.exercises.clear(), db.programs.clear(), db.workouts.clear(), db.bodyweight.clear(), db.settings.clear()])
    await db.exercises.bulkAdd(b.exercises)
    await db.programs.bulkAdd(b.programs)
    await db.workouts.bulkAdd(b.workouts)
    await db.bodyweight.bulkAdd(b.bodyweight)
    await db.settings.add({ ...b.settings, activeRest: null })
  })
}

const csvCell = (v: string | number | boolean | null) => {
  const s = v === null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV med semikolon og desimalkomma (åpnes riktig i norsk Excel/Numbers). */
export function toCsv(rows: (string | number | boolean | null)[][]): string {
  return '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\n')
}

export function setsCsv(workouts: WorkoutSession[], exercises: Exercise[], programs: Program[]): string {
  const ex = new Map(exercises.map((e) => [e.id, e.name]))
  const rows: (string | number | boolean | null)[][] = [
    ['dato', 'tid', 'økt', 'øvelse', 'sett', 'vekt_kg', 'reps', 'rir', 'oppvarming', 'god_form'],
  ]
  for (const w of [...workouts].filter((x) => x.end !== null).sort((a, b) => a.start.localeCompare(b.start))) {
    const name = programs.find((p) => p.id === w.programId)?.sessions.find((s) => s.id === w.sessionId)?.name ?? w.sessionId
    for (const s of w.sets) {
      rows.push([
        localDate(s.time),
        new Date(s.time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
        name,
        ex.get(s.exerciseId) ?? s.exerciseId,
        s.setNumber,
        s.weight,
        s.reps,
        s.rir === null ? null : s.rir === 4 ? '4+' : s.rir,
        s.warmup ? 'ja' : 'nei',
        s.goodForm ? 'ja' : 'nei',
      ])
    }
  }
  return toCsv(rows)
}

export function bodyweightCsv(entries: BodyweightEntry[]): string {
  return toCsv([['dato', 'kg'], ...[...entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.kg])])
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportJson() {
  const now = new Date()
  const b = await buildBackup(now)
  download(`treningsapp-${localDate(now)}.json`, JSON.stringify(b, null, 1), 'application/json')
  await db.settings.update('settings', { lastExport: now.toISOString() })
}

export async function exportCsv() {
  const [workouts, exercises, programs, bodyweight] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.programs.toArray(),
    db.bodyweight.toArray(),
  ])
  const d = localDate(new Date())
  download(`sett-${d}.csv`, setsCsv(workouts, exercises, programs), 'text/csv')
  download(`kroppsvekt-${d}.csv`, bodyweightCsv(bodyweight), 'text/csv')
}

/** Dager siden siste eksport; null = aldri. */
export function daysSinceExport(lastExport: string | null, now = new Date()): number | null {
  if (!lastExport) return null
  return Math.floor((now.getTime() - new Date(lastExport).getTime()) / 86_400_000)
}

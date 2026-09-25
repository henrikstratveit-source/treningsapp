// Rotasjon (SPEC 6) med avklaringene i PLAN.md (spørsmål 14–16).
import { localDate, mondayOf } from './dates'
import type { Program, ProgramSession, WorkoutSession } from './types'

/** Fullført = avsluttet økt med minst ett arbeidssett (svar 14). */
export const isCompleted = (w: WorkoutSession) => w.end !== null && w.sets.some((s) => !s.warmup)

export interface NextSessionInput {
  program: Program
  /** Alle økter (filtreres på program her) */
  workouts: WorkoutSession[]
  /** 'YYYY-MM-DD' */
  today: string
  /** Mandag i uka der bonusøkta ble hoppet over, eller null */
  bonusSkippedWeek: string | null
}

export function nextSession({ program, workouts, today, bonusSkippedWeek }: NextSessionInput): ProgramSession {
  const core = program.sessions.filter((s) => !s.bonus)
  const bonus = program.sessions.find((s) => s.bonus)
  const done = workouts
    .filter((w) => w.programId === program.id && isCompleted(w))
    .sort((a, b) => a.start.localeCompare(b.start))

  // Bonus: bare når alle kjerneøktene er fullført denne uka, og bonus verken er tatt eller hoppet over.
  if (bonus) {
    const week = mondayOf(today)
    const thisWeek = done.filter((w) => mondayOf(localDate(w.start)) === week)
    const ids = new Set(thisWeek.map((w) => w.sessionId))
    if (core.every((s) => ids.has(s.id)) && !ids.has(bonus.id) && bonusSkippedWeek !== week) return bonus
  }

  // Bonus påvirker ikke rotasjonen (svar 15): neste etter sist fullførte kjerneøkt.
  const lastCore = [...done].reverse().find((w) => core.some((s) => s.id === w.sessionId))
  if (!lastCore) return core[0]
  const i = core.findIndex((s) => s.id === lastCore.sessionId)
  return core[(i + 1) % core.length]
}

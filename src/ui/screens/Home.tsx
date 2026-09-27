import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { daysBetween, localDate, mondayOf } from '../../domain/dates'
import { isCompleted, nextSession } from '../../domain/rotation'
import type { ProgramSession } from '../../domain/types'
import { MSG_WEIGHT_STALLED, weightStalled } from '../../domain/bodyweight'
import { daysSinceExport } from '../../data/backup'
import { db } from '../../data/db'
import { skipBonus, startWorkout } from '../../data/repo'
import { BodyweightQuick } from '../components/BodyweightQuick'
import { formatDate } from '../format'

export function Home({ onOpenWorkout }: { onOpenWorkout: (id: string) => void }) {
  const [pick, setPick] = useState(false)
  const data = useLiveQuery(async () => {
    const [settings, programs, workouts, bodyweight, exercises] = await Promise.all([
      db.settings.get('settings'),
      db.programs.toArray(),
      db.workouts.toArray(),
      db.bodyweight.toArray(),
      db.exercises.toArray(),
    ])
    return { settings, programs, workouts, bodyweight, exercises }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>

  const { settings, programs, workouts, bodyweight, exercises } = data
  const exNames = new Map(exercises.map((e) => [e.id, e.name]))
  const program = programs.find((p) => p.id === settings.activeProgramId) ?? programs[0]
  const today = localDate(new Date())
  const week = mondayOf(today)
  const active = workouts.find((w) => w.end === null)
  const next = nextSession({ program, workouts, today, bonusSkippedWeek: settings.bonusSkippedWeek })
  const sessionName = (programId: string, sessionId: string) =>
    programs.find((p) => p.id === programId)?.sessions.find((s) => s.id === sessionId)?.name ?? sessionId
  // Aldri eksportert: regn fra første økt.
  const since = settings.lastExport
    ? daysSinceExport(settings.lastExport)
    : settings.firstWorkoutDate && daysBetween(settings.firstWorkoutDate, today)
  const exportReminder =
    since && since > 14
      ? settings.lastExport
        ? `Det er ${since} dager siden siste backup. Eksporter under Innst.`
        : 'Du har ikke tatt backup ennå. Eksporter under Innst.'
      : null
  const thisWeek = workouts
    .filter((w) => isCompleted(w) && mondayOf(localDate(w.start)) === week)
    .sort((a, b) => a.start.localeCompare(b.start))

  async function start(session: ProgramSession) {
    onOpenWorkout(await startWorkout(program.id, session))
  }

  return (
    <>
      <h1>Trening</h1>
      <p className="muted small">{program.name}</p>
      {weightStalled(bodyweight, today) && <p className="alert">{MSG_WEIGHT_STALLED}</p>}
      {exportReminder && <p className="alert">{exportReminder}</p>}

      {/* Utseendet «Ny»: kort med neste økt og øvelsene (skjult i klassisk) */}
      <section className="hero">
        {active ? (
          <>
            <div className="hero-label">Pågår</div>
            <div className="hero-title">{sessionName(active.programId, active.sessionId)}</div>
            <button className="btn big primary full" onClick={() => onOpenWorkout(active.id)}>
              Fortsett økta
            </button>
          </>
        ) : (
          <>
            <div className="hero-label">{next.bonus ? 'Bonusøkt' : 'Neste økt'}</div>
            <div className="hero-title">{next.name}</div>
            <ul className="hero-list">
              {next.slots.map((sl, i) => (
                <li key={i}>
                  <span>{exNames.get(sl.exerciseId) ?? sl.exerciseId}</span>
                  <span>
                    {sl.sets} × {sl.repMin}–{sl.repMax}
                  </span>
                </li>
              ))}
            </ul>
            <button className="btn big primary full" onClick={() => start(next)}>
              Start økta
            </button>
          </>
        )}
      </section>

      {active ? (
        <button className="btn big primary classic-only" onClick={() => onOpenWorkout(active.id)}>
          Fortsett økt: {sessionName(active.programId, active.sessionId)}
        </button>
      ) : (
        <>
          <button className="btn big primary classic-only" onClick={() => start(next)}>
            Start neste økt: {next.name}
          </button>
          <div className="row-actions">
            {next.bonus && (
              <button className="btn small ghost" onClick={() => skipBonus(week)}>
                Hopp over bonus
              </button>
            )}
            <button className="btn small ghost" onClick={() => setPick((p) => !p)}>
              Velg annen økt
            </button>
          </div>
          {pick && (
            <div className="swap">
              {program.sessions.map((s) => (
                <button key={s.id} className="btn" onClick={() => start(s)}>
                  {s.name} {s.bonus && <span className="tag">bonus</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <BodyweightQuick />

      <section className="card">
        <h2>Denne uka: {thisWeek.length} økter</h2>
        {thisWeek.length === 0 ? (
          <p className="muted small">Ingen økter ennå.</p>
        ) : (
          <ul>
            {thisWeek.map((w) => (
              <li key={w.id}>
                {formatDate(w.start)} – {sessionName(w.programId, w.sessionId)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

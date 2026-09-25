import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { localDate, mondayOf } from '../../domain/dates'
import { isCompleted, nextSession } from '../../domain/rotation'
import type { ProgramSession } from '../../domain/types'
import { db } from '../../data/db'
import { skipBonus, startWorkout } from '../../data/repo'
import { formatDate } from '../format'

export function Home({ onOpenWorkout }: { onOpenWorkout: (id: string) => void }) {
  const [pick, setPick] = useState(false)
  const data = useLiveQuery(async () => {
    const [settings, programs, workouts] = await Promise.all([
      db.settings.get('settings'),
      db.programs.toArray(),
      db.workouts.toArray(),
    ])
    return { settings, programs, workouts }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>

  const { settings, programs, workouts } = data
  const program = programs.find((p) => p.id === settings.activeProgramId) ?? programs[0]
  const today = localDate(new Date())
  const week = mondayOf(today)
  const active = workouts.find((w) => w.end === null)
  const next = nextSession({ program, workouts, today, bonusSkippedWeek: settings.bonusSkippedWeek })
  const sessionName = (programId: string, sessionId: string) =>
    programs.find((p) => p.id === programId)?.sessions.find((s) => s.id === sessionId)?.name ?? sessionId
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

      {active ? (
        <button className="btn big primary" onClick={() => onOpenWorkout(active.id)}>
          Fortsett økt: {sessionName(active.programId, active.sessionId)}
        </button>
      ) : (
        <>
          <button className="btn big primary" onClick={() => start(next)}>
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

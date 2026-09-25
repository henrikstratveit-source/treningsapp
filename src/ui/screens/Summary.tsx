import { useLiveQuery } from 'dexie-react-hooks'
import { localDate } from '../../domain/dates'
import { inTechniquePhase } from '../../domain/rir'
import { summarize } from '../../domain/workout'
import { db } from '../../data/db'
import { describeNext, kg, repsList } from '../format'

/** Sammendrag etter økta (SPEC 8 regel 7). */
export function Summary({ workoutId, onDone }: { workoutId: string; onDone: () => void }) {
  const data = useLiveQuery(async () => {
    const [workout, all, exercises, settings, programs] = await Promise.all([
      db.workouts.get(workoutId),
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.settings.get('settings'),
      db.programs.toArray(),
    ])
    return { workout, all, exercises, settings, programs }
  }, [workoutId])
  if (!data?.workout || !data.settings) return <p className="muted">Laster …</p>

  const { workout, all, exercises, settings, programs } = data
  const exMap = new Map(exercises.map((e) => [e.id, e]))
  const technique = inTechniquePhase(settings.techniquePhase, settings.firstWorkoutDate, localDate(new Date()))
  const items = summarize(workout, all, exMap, technique)
  const name = programs.find((p) => p.id === workout.programId)?.sessions.find((s) => s.id === workout.sessionId)?.name
  const minutes = workout.end ? Math.round((+new Date(workout.end) - +new Date(workout.start)) / 60_000) : 0
  const recs = items.filter((i) => i.record)

  return (
    <>
      <h1>Bra jobba!</h1>
      <p className="muted">
        {name} · {minutes} min · {workout.sets.filter((s) => !s.warmup).length} arbeidssett
      </p>

      {recs.length > 0 && (
        <section className="card highlight">
          <h2>Personlige rekorder</h2>
          <ul>
            {recs.map((i) => (
              <li key={i.exerciseId}>
                {exMap.get(i.exerciseId)?.name}:{' '}
                {[
                  i.record!.weight && `ny høyeste vekt ${kg(i.record!.bestWeight)}`,
                  i.record!.e1rm && `ny beste estimert 1RM ${kg(i.record!.bestE1rm)}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.map((i) => (
        <section key={i.exerciseId} className="card">
          <h2>{exMap.get(i.exerciseId)?.name}</h2>
          <p className="muted small">
            {kg(i.weight)} × {repsList(i.reps)}
          </p>
          <p className={i.next.kind === 'increase' ? 'good' : ''}>{describeNext(i.next)}</p>
          {i.next.messages.map((m) => (
            <p key={m} className="warn small">
              {m}
            </p>
          ))}
        </section>
      ))}

      <button className="btn big primary" onClick={onDone}>
        Ferdig
      </button>
    </>
  )
}

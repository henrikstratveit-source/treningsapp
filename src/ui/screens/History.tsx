import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'
import { formatDate, kg } from '../format'

/** Tidligere økter, nyeste først. Progresjonsgrafer per øvelse kommer i milepæl 5. */
export function History() {
  const data = useLiveQuery(async () => {
    const [workouts, exercises, programs] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.programs.toArray(),
    ])
    return { workouts, exercises, programs }
  })
  if (!data) return <p className="muted">Laster …</p>

  const exMap = new Map(data.exercises.map((e) => [e.id, e.name]))
  const done = data.workouts.filter((w) => w.end !== null).sort((a, b) => b.start.localeCompare(a.start))

  return (
    <>
      <h1>Historikk</h1>
      {done.length === 0 && <p className="muted">Ingen økter ennå.</p>}
      {done.map((w) => {
        const name = data.programs.find((p) => p.id === w.programId)?.sessions.find((s) => s.id === w.sessionId)?.name
        const ids = [...new Set(w.sets.map((s) => s.exerciseId))]
        return (
          <section key={w.id} className="card">
            <h2>
              {formatDate(w.start)} – {name}
            </h2>
            {ids.map((id) => {
              const sets = w.sets.filter((s) => s.exerciseId === id && !s.warmup)
              if (sets.length === 0) return null
              return (
                <p key={id} className="small">
                  <strong>{exMap.get(id)}</strong>
                  <br />
                  <span className="muted">
                    {sets.map((s) => `${kg(s.weight)} × ${s.reps}${s.goodForm ? '' : ' (dårlig form)'}`).join(', ')}
                  </span>
                </p>
              )
            })}
          </section>
        )
      })}
    </>
  )
}

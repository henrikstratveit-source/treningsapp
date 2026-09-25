import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'

// Midlertidig hjem-skjerm (milepæl 1): viser aktivt program og øktene.
export function Home() {
  const data = useLiveQuery(async () => {
    const settings = await db.settings.get('settings')
    const programs = await db.programs.toArray()
    const exercises = await db.exercises.toArray()
    return { settings, programs, exercises }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>

  const names = new Map(data.exercises.map((e) => [e.id, e.name]))
  const active = data.programs.find((p) => p.id === data.settings!.activeProgramId)

  return (
    <>
      <h1>Trening</h1>
      <p className="muted">
        Aktivt program: <strong>{active?.name}</strong> · {data.exercises.length} øvelser i biblioteket
      </p>
      {active?.sessions.map((s) => (
        <section key={s.id} className="card">
          <h2>
            {s.name} {s.bonus && <span className="tag">bonus</span>}
          </h2>
          <ul>
            {s.slots.map((sl, i) => (
              <li key={i}>
                {names.get(sl.exerciseId)} – {sl.sets} × {sl.repMin}–{sl.repMax}
                {sl.optional && ' (valgfri)'}
                {sl.alternatives.length > 0 && (
                  <span className="muted"> · alt: {sl.alternatives.map((a) => names.get(a)).join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

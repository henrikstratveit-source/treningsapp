import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { localDate, mondayOf } from '../../domain/dates'
import {
  ALL_MUSCLES,
  exerciseProgress,
  hardSetsAverage,
  hardSetsForWeek,
  PRIORITY_MUSCLE,
  programSuggestion,
  sessionsPerWeek,
} from '../../domain/stats'
import { db } from '../../data/db'
import { kg } from '../format'
import { shortDate } from './Bodyweight'

// Samme validerte par som kroppsvekt-grafen.
const C_WEIGHT = '#3b87e0'
const C_E1RM = '#c07a08'

const num = (n: number | null | undefined, d = 1) =>
  n === null || n === undefined ? '–' : (Math.round(n * 10 ** d) / 10 ** d).toString().replace('.', ',')

export function Stats() {
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const data = useLiveQuery(async () => {
    const [workouts, exercises, settings] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.settings.get('settings'),
    ])
    return { workouts, exercises, settings }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>

  const { workouts, exercises, settings } = data
  const today = localDate(new Date())
  const exMap = new Map(exercises.map((e) => [e.id, e]))
  const thisWeek = hardSetsForWeek(workouts, exMap, mondayOf(today))
  const avg4 = hardSetsAverage(workouts, exMap, today)
  const maxSets = Math.max(1, ...ALL_MUSCLES.map((m) => Math.max(thisWeek.get(m) ?? 0, avg4.get(m) ?? 0)))
  const suggestion = programSuggestion(settings.activeProgramId, workouts, today)

  const done = new Set(workouts.filter((w) => w.end !== null).flatMap((w) => w.sets.filter((s) => !s.warmup).map((s) => s.exerciseId)))
  const withHistory = exercises.filter((e) => done.has(e.id))
  const selected = exerciseId && done.has(exerciseId) ? exerciseId : withHistory[0]?.id
  const progress = selected ? exerciseProgress(selected, workouts) : []

  return (
    <>
      <h1>Statistikk</h1>

      {suggestion && (
        <section className="card highlight">
          <p>{suggestion}</p>
          <button className="btn primary full" onClick={() => db.settings.update('settings', { activeProgramId: 'upper_lower' })}>
            Bytt til overkropp/underkropp
          </button>
        </section>
      )}

      <div className="tiles">
        <div className="tile">
          <div className="tile-label">Økter per uke, 4 uker</div>
          <div className="tile-value">{num(sessionsPerWeek(workouts, today, 4))}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Økter per uke, 6 uker</div>
          <div className="tile-value">{num(sessionsPerWeek(workouts, today, 6))}</div>
        </div>
      </div>
      <p className="muted small">Snitt over fulle uker (man–søn) siden du begynte å logge.</p>

      <section className="card">
        <h2>Harde sett per muskel</h2>
        <table className="table sets-table">
          <thead>
            <tr>
              <th />
              <th>Denne uka</th>
              <th>Snitt 4 uker</th>
            </tr>
          </thead>
          <tbody>
            {ALL_MUSCLES.map((m) => {
              const cur = thisWeek.get(m) ?? 0
              const avg = avg4.get(m) ?? 0
              const prio = m === PRIORITY_MUSCLE
              return (
                <tr key={m} className={prio ? 'prio' : ''} title={`${m}: ${num(cur)} denne uka, ${num(avg)} i snitt`}>
                  <td>
                    {m[0].toUpperCase() + m.slice(1)}
                    {prio && <span className="tag">prioritet</span>}
                  </td>
                  <td>
                    <div className="bar-cell">
                      <span className="bar" style={{ width: `${(cur / maxSets) * 100}%` }} />
                      <span>{num(cur)}</span>
                    </div>
                  </td>
                  <td className="muted">{num(avg)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="muted small">Direkte muskel = 1 sett, indirekte = 0,5. Oppvarming teller ikke.</p>
      </section>

      <section className="card chart">
        <h2>Progresjon per øvelse</h2>
        {withHistory.length === 0 ? (
          <p className="muted small">Ingen øvelser logget ennå.</p>
        ) : (
          <>
            <select className="select" value={selected} onChange={(e) => setExerciseId(e.target.value)}>
              {withHistory.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progress} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#252b34" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} stroke="#8b95a3" fontSize={12} tickLine={false} minTickGap={24} />
                <YAxis stroke="#8b95a3" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1b2027', border: '1px solid #252b34', borderRadius: 10, color: '#e8ecf1' }}
                  labelFormatter={(d, p) => {
                    const pt = p?.[0]?.payload as (typeof progress)[number] | undefined
                    return `${shortDate(String(d))}${pt ? ` · reps ${pt.reps.join(', ')}` : ''}`
                  }}
                  formatter={(v, name) => [kg(Number(v)), name]}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line name="Arbeidsvekt" dataKey="weight" stroke={C_WEIGHT} strokeWidth={2} dot={{ r: 4, fill: C_WEIGHT }} isAnimationActive={false} />
                <Line
                  name="Estimert 1RM"
                  dataKey="e1rm"
                  stroke={C_E1RM}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <table className="table">
              <tbody>
                {[...progress].reverse().map((p, i) => (
                  <tr key={i}>
                    <td>{shortDate(p.date)}</td>
                    <td>{kg(p.weight)}</td>
                    <td className="muted">{p.reps.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </>
  )
}

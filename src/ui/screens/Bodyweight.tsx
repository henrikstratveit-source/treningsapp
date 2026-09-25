import { useLiveQuery } from 'dexie-react-hooks'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { movingAverage7, MSG_WEIGHT_STALLED, summarizeBodyweight, weeklyAverages } from '../../domain/bodyweight'
import { localDate } from '../../domain/dates'
import { db } from '../../data/db'
import { deleteBodyweight } from '../../data/repo'
import { kg } from '../format'

// Validert mot mørk flate (dataviz-validator): daglig = gul, 7-dagers snitt = blå.
const C_DAILY = '#c07a08'
const C_AVG = '#3b87e0'

const num = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${num(Math.abs(n), d)}`
export const shortDate = (date: string) => {
  const [, m, d] = date.split('-')
  return `${Number(d)}.${Number(m)}`
}

export function Bodyweight() {
  const data = useLiveQuery(async () => {
    const [entries, settings] = await Promise.all([db.bodyweight.toArray(), db.settings.get('settings')])
    return { entries, settings }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>

  const { entries, settings } = data
  const today = localDate(new Date())
  const sum = summarizeBodyweight(entries, today, settings.startWeight, settings.targetRate)
  const series = movingAverage7(entries).map((x) => ({ ...x, avg7: Math.round(x.avg7 * 100) / 100 }))
  const weeks = weeklyAverages(entries, today).reverse()
  const toGoal = sum.current !== null ? settings.goalWeight - sum.current : null
  const kgs = series.flatMap((x) => [x.kg, x.avg7])
  const lo = Math.floor(Math.min(...kgs) - 0.5)
  const hi = Math.ceil(Math.max(...kgs) + 0.5)
  const tickStep = hi - lo <= 4 ? 0.5 : hi - lo <= 10 ? 1 : 2
  const ticks = Array.from({ length: Math.floor((hi - lo) / tickStep) + 1 }, (_, i) => lo + i * tickStep)

  let rateSub = 'Trenger minst 2 fulle uker'
  if (settings.targetRate !== null) {
    const status = sum.vsTarget === null ? 'for lite data' : sum.vsTarget === 'på' ? 'i rute' : `du ligger ${sum.vsTarget}`
    rateSub = `Mål ${num(settings.targetRate, 2)} kg/uke · ${status}`
  } else if (sum.rate4w !== null) rateSub = ''

  return (
    <>
      <h1>Kroppsvekt</h1>
      {sum.stalled && <p className="alert">{MSG_WEIGHT_STALLED}</p>}

      <div className="tiles">
        <div className="tile">
          <div className="tile-label">7-dagers snitt</div>
          <div className="tile-value">{sum.current !== null ? kg(Math.round(sum.current * 10) / 10) : '–'}</div>
          <div className="tile-sub">
            Start {kg(settings.startWeight)} · mål {kg(settings.goalWeight)}
          </div>
        </div>
        <div className="tile">
          <div className="tile-label">Endring hittil</div>
          <div className="tile-value">{sum.changeSoFar !== null ? `${signed(sum.changeSoFar)} kg` : '–'}</div>
          <div className="tile-sub">{toGoal !== null ? `${num(Math.max(0, toGoal))} kg igjen til målet` : ''}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Per uke, siste 4 uker</div>
          <div className="tile-value">{sum.rate4w !== null ? `${signed(sum.rate4w, 2)} kg` : '–'}</div>
          <div className="tile-sub">{rateSub}</div>
        </div>
      </div>

      {series.length > 0 && (
        <section className="card chart">
          <h2>Utvikling</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#252b34" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} stroke="#8b95a3" fontSize={12} tickLine={false} minTickGap={24} />
              <YAxis
                domain={[lo, hi]}
                ticks={ticks}
                tickFormatter={(v: number) => num(v, tickStep < 1 ? 1 : 0)}
                stroke="#8b95a3"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1b2027', border: '1px solid #252b34', borderRadius: 10, color: '#e8ecf1' }}
                labelFormatter={(d) => shortDate(String(d))}
                formatter={(v, name) => [kg(Number(v)), name]}
              />
              <Legend wrapperStyle={{ fontSize: 13, color: '#8b95a3' }} />
              <Line
                name="Daglig"
                dataKey="kg"
                stroke={C_DAILY}
                strokeWidth={0}
                dot={{ r: 4, fill: C_DAILY, stroke: '#1b2027', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                legendType="circle"
                isAnimationActive={false}
              />
              <Line name="7-dagers snitt" dataKey="avg7" stroke={C_AVG} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="card">
        <h2>Uker</h2>
        {weeks.length === 0 && <p className="muted small">Ingen målinger ennå. Registrer vekta på Hjem.</p>}
        <table className="table">
          <tbody>
            {weeks.map((w) => (
              <tr key={w.week} className={w.valid ? '' : 'muted'}>
                <td>Uke fra {shortDate(w.week)}</td>
                <td>{kg(Math.round(w.avg * 100) / 100)}</td>
                <td>{w.change !== null ? signed(w.change, 2) : ''}</td>
                <td className="small">{w.valid ? (w.full ? '' : 'pågår') : `${w.count} målinger – teller ikke`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Målinger</h2>
        <table className="table">
          <tbody>
            {[...entries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => (
                <tr key={e.date}>
                  <td>{shortDate(e.date)}</td>
                  <td>{kg(e.kg)}</td>
                  <td className="right">
                    <button className="btn small ghost" onClick={() => confirm('Slette målingen?') && deleteBodyweight(e.date)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

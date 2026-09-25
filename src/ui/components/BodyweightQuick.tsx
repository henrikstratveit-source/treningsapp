import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { localDate } from '../../domain/dates'
import { db } from '../../data/db'
import { setBodyweight } from '../../data/repo'
import { kg } from '../format'
import { Stepper } from './SetEditor'

/** Rask registrering av dagens vekt fra hjem-skjermen. */
export function BodyweightQuick() {
  const today = localDate(new Date())
  const data = useLiveQuery(async () => {
    const all = await db.bodyweight.orderBy('date').toArray()
    const settings = await db.settings.get('settings')
    return { todays: all.find((e) => e.date === today), last: all[all.length - 1], start: settings?.startWeight ?? 70 }
  }, [today])
  const [value, setValue] = useState<number | null>(null)
  if (!data) return null

  const shown = value ?? data.todays?.kg ?? data.last?.kg ?? data.start
  return (
    <section className="card">
      <h2>Kroppsvekt i dag</h2>
      {data.todays && <p className="muted small">Registrert: {kg(data.todays.kg)}. Lagrer du igjen, overskrives den.</p>}
      <div className="set-inputs">
        <Stepper value={shown} step={0.1} unit="kg" onChange={setValue} />
        <button
          className="btn primary"
          onClick={async () => {
            await setBodyweight(today, shown)
            setValue(null)
          }}
        >
          Lagre
        </button>
      </div>
      <p className="muted small">Morgen, etter do, før mat.</p>
    </section>
  )
}

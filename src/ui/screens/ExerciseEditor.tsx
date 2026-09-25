import { useState } from 'react'
import { ALL_MUSCLES } from '../../domain/stats'
import type { Exercise, MuscleShare } from '../../domain/types'
import { newId, saveExercise } from '../../data/repo'

export function blankExercise(restCompound: number): Exercise {
  return { id: `egen_${newId().slice(0, 8)}`, name: '', type: 'flerledd', step: 5, rest: restCompound, muscles: [] }
}

/** Rediger eller lag en øvelse: navn, type, økningssteg, pausetid og muskler (SPEC 4). */
export function ExerciseEditor({ initial, onDone }: { initial: Exercise; onDone: () => void }) {
  const [e, setE] = useState<Exercise>(initial)
  const upd = (p: Partial<Exercise>) => setE((x) => ({ ...x, ...p }))

  const shareOf = (m: string) => e.muscles.find((x) => x.muscle === m)?.share ?? 0
  function cycle(m: MuscleShare['muscle']) {
    const next = { 0: 1, 1: 0.5, 0.5: 0 }[shareOf(m)] as 0 | 0.5 | 1
    const rest = e.muscles.filter((x) => x.muscle !== m)
    upd({ muscles: next === 0 ? rest : [...rest, { muscle: m, share: next }] })
  }

  const valid = e.name.trim() !== '' && e.step > 0 && e.rest > 0 && e.muscles.some((m) => m.share === 1)

  return (
    <>
      <div className="workout-head">
        <button className="btn small ghost" onClick={onDone}>
          ‹ Tilbake
        </button>
        <h1 className="grow">{initial.name || 'Ny øvelse'}</h1>
      </div>

      <section className="card form">
        <label>
          Navn
          <input className="input" value={e.name} onChange={(x) => upd({ name: x.target.value })} />
        </label>
        <label>
          Type
          <select className="select" value={e.type} onChange={(x) => upd({ type: x.target.value as Exercise['type'] })}>
            <option value="flerledd">Flerledd</option>
            <option value="isolasjon">Isolasjon</option>
          </select>
        </label>
        <div className="form-row">
          <label>
            Økningssteg (kg)
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.5"
              value={e.step}
              onChange={(x) => upd({ step: Number(x.target.value.replace(',', '.')) })}
            />
          </label>
          <label>
            Pause (sek)
            <input
              className="input"
              type="number"
              inputMode="numeric"
              step="15"
              value={e.rest}
              onChange={(x) => upd({ rest: Number(x.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Muskler</h2>
        <p className="muted small">Trykk for å veksle: direkte (1) → indirekte (0,5) → ingen.</p>
        <div className="chips">
          {ALL_MUSCLES.map((m) => {
            const s = shareOf(m)
            return (
              <button key={m} className={`chip wide ${s === 1 ? 'on' : s === 0.5 ? 'half' : ''}`} onClick={() => cycle(m)}>
                {m} {s === 1 ? '· 1' : s === 0.5 ? '· 0,5' : ''}
              </button>
            )
          })}
        </div>
      </section>

      {!valid && <p className="muted small">Fyll inn navn, steg, pause og minst én direkte muskel.</p>}
      <button
        className="btn big primary"
        disabled={!valid}
        onClick={async () => {
          await saveExercise({ ...e, name: e.name.trim() })
          onDone()
        }}
      >
        Lagre øvelse
      </button>
    </>
  )
}

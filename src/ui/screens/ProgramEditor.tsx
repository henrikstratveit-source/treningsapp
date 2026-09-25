import { useState } from 'react'
import type { Exercise, Program, ProgramSession, Slot } from '../../domain/types'
import { deleteProgram, newId, saveProgram } from '../../data/repo'

export function blankProgram(): Program {
  return {
    id: `prog_${newId().slice(0, 8)}`,
    name: 'Nytt program',
    builtIn: false,
    sessions: [{ id: newId().slice(0, 8), name: 'Økt 1', bonus: false, slots: [] }],
  }
}

function move<T>(xs: T[], i: number, d: number): T[] {
  const j = i + d
  if (j < 0 || j >= xs.length) return xs
  const c = [...xs]
  ;[c[i], c[j]] = [c[j], c[i]]
  return c
}

const numInput = (value: number, onChange: (n: number) => void, label: string) => (
  <label className="mini">
    <span>{label}</span>
    <input className="input" type="number" inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
)

interface Props {
  initial: Program
  exercises: Exercise[]
  isActive: boolean
  onDone: () => void
}

/** Rediger program: økter og øvelser (legge til, fjerne, rekkefølge, sett, rep-område). */
export function ProgramEditor({ initial, exercises, isActive, onDone }: Props) {
  const [p, setP] = useState<Program>(initial)
  const names = new Map(exercises.map((e) => [e.id, e.name]))
  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name, 'nb'))

  const setSessions = (sessions: ProgramSession[]) => setP((x) => ({ ...x, sessions }))
  const updSession = (i: number, patch: Partial<ProgramSession>) =>
    setSessions(p.sessions.map((s, k) => (k === i ? { ...s, ...patch } : s)))
  const updSlot = (si: number, i: number, patch: Partial<Slot>) =>
    updSession(si, { slots: p.sessions[si].slots.map((s, k) => (k === i ? { ...s, ...patch } : s)) })

  const problems: string[] = []
  if (!p.name.trim()) problems.push('Programmet må ha navn.')
  if (!p.sessions.some((s) => !s.bonus)) problems.push('Minst én økt må være en vanlig (ikke bonus) økt.')
  if (p.sessions.filter((s) => s.bonus).length > 1) problems.push('Bare én bonusøkt støttes.')
  p.sessions.forEach((s) => {
    if (s.slots.length === 0) problems.push(`«${s.name}» har ingen øvelser.`)
    if (s.slots.some((x) => x.sets < 1 || x.repMin < 1 || x.repMin > x.repMax))
      problems.push(`«${s.name}»: sjekk sett og rep-område.`)
  })

  return (
    <>
      <div className="workout-head">
        <button className="btn small ghost" onClick={onDone}>
          ‹ Tilbake
        </button>
        <h1 className="grow">Rediger program</h1>
      </div>

      <section className="card form">
        <label>
          Navn
          <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </label>
      </section>

      {p.sessions.map((s, si) => (
        <section key={s.id} className="card form">
          <div className="form-row">
            <input className="input grow" value={s.name} onChange={(e) => updSession(si, { name: e.target.value })} />
            <button className="btn small ghost" onClick={() => setSessions(move(p.sessions, si, -1))} aria-label="Flytt opp">
              ↑
            </button>
            <button className="btn small ghost" onClick={() => setSessions(move(p.sessions, si, 1))} aria-label="Flytt ned">
              ↓
            </button>
            <button
              className="btn small ghost danger"
              onClick={() => confirm(`Fjerne økta «${s.name}»?`) && setSessions(p.sessions.filter((_, k) => k !== si))}
            >
              ×
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={s.bonus} onChange={(e) => updSession(si, { bonus: e.target.checked })} />
            Bonusøkt (foreslås når alle andre økter er tatt denne uka)
          </label>

          {s.slots.map((sl, i) => (
            <div key={i} className="slot-edit">
              <div className="form-row">
                <select className="select grow" value={sl.exerciseId} onChange={(e) => updSlot(si, i, { exerciseId: e.target.value })}>
                  {sorted.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <button className="btn small ghost" onClick={() => updSession(si, { slots: move(s.slots, i, -1) })}>
                  ↑
                </button>
                <button className="btn small ghost" onClick={() => updSession(si, { slots: move(s.slots, i, 1) })}>
                  ↓
                </button>
                <button className="btn small ghost danger" onClick={() => updSession(si, { slots: s.slots.filter((_, k) => k !== i) })}>
                  ×
                </button>
              </div>
              <div className="form-row">
                {numInput(sl.sets, (n) => updSlot(si, i, { sets: n }), 'Sett')}
                {numInput(sl.repMin, (n) => updSlot(si, i, { repMin: n }), 'Reps min')}
                {numInput(sl.repMax, (n) => updSlot(si, i, { repMax: n }), 'Reps maks')}
                <label className="check mini">
                  <input type="checkbox" checked={sl.optional} onChange={(e) => updSlot(si, i, { optional: e.target.checked })} />
                  Valgfri
                </label>
              </div>
              <div className="chips">
                <span className="muted small">Alternativer:</span>
                {sl.alternatives.map((a) => (
                  <button
                    key={a}
                    className="chip wide on"
                    onClick={() => updSlot(si, i, { alternatives: sl.alternatives.filter((x) => x !== a) })}
                  >
                    {names.get(a)} ×
                  </button>
                ))}
                <select
                  className="select mini-select"
                  value=""
                  onChange={(e) => e.target.value && updSlot(si, i, { alternatives: [...sl.alternatives, e.target.value] })}
                >
                  <option value="">+ legg til</option>
                  {sorted
                    .filter((e) => e.id !== sl.exerciseId && !sl.alternatives.includes(e.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
          <button
            className="btn small ghost"
            onClick={() =>
              updSession(si, {
                slots: [...s.slots, { exerciseId: sorted[0].id, sets: 3, repMin: 10, repMax: 15, optional: false, alternatives: [] }],
              })
            }
          >
            + Øvelse
          </button>
        </section>
      ))}

      <button
        className="btn full"
        onClick={() =>
          setSessions([...p.sessions, { id: newId().slice(0, 8), name: `Økt ${p.sessions.length + 1}`, bonus: false, slots: [] }])
        }
      >
        + Økt
      </button>

      {problems.map((m) => (
        <p key={m} className="warn small">
          {m}
        </p>
      ))}
      <button
        className="btn big primary"
        disabled={problems.length > 0}
        onClick={async () => {
          await saveProgram({ ...p, name: p.name.trim() })
          onDone()
        }}
      >
        Lagre program
      </button>
      {!p.builtIn && !isActive && (
        <button
          className="btn ghost danger full"
          onClick={async () => {
            if (!confirm(`Slette programmet «${p.name}»? Historikken beholdes.`)) return
            await deleteProgram(p.id)
            onDone()
          }}
        >
          Slett program
        </button>
      )}
    </>
  )
}

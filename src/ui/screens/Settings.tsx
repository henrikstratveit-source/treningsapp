import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { localDate } from '../../domain/dates'
import { inTechniquePhase } from '../../domain/rir'
import type { Exercise, Program } from '../../domain/types'
import { daysSinceExport, exportCsv, exportJson, parseBackup, restoreBackup } from '../../data/backup'
import { db } from '../../data/db'
import { resetDefaults, setGlobalRest, updateSettings } from '../../data/repo'
import { Stepper } from '../components/SetEditor'
import { kg } from '../format'
import { blankExercise, ExerciseEditor } from './ExerciseEditor'
import { blankProgram, ProgramEditor } from './ProgramEditor'

type Edit = { kind: 'program'; program: Program } | { kind: 'exercise'; exercise: Exercise } | null

export function Settings() {
  const [edit, setEdit] = useState<Edit>(null)
  const [showExercises, setShowExercises] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const data = useLiveQuery(async () => {
    const [settings, programs, exercises] = await Promise.all([
      db.settings.get('settings'),
      db.programs.toArray(),
      db.exercises.toArray(),
    ])
    return { settings, programs, exercises }
  })
  if (!data?.settings) return <p className="muted">Laster …</p>
  const { settings, programs, exercises } = data

  if (edit?.kind === 'program')
    return (
      <ProgramEditor
        initial={edit.program}
        exercises={exercises}
        isActive={edit.program.id === settings.activeProgramId}
        onDone={() => setEdit(null)}
      />
    )
  if (edit?.kind === 'exercise') return <ExerciseEditor initial={edit.exercise} onDone={() => setEdit(null)} />

  const today = localDate(new Date())
  const technique = inTechniquePhase(settings.techniquePhase, settings.firstWorkoutDate, today)
  const since = daysSinceExport(settings.lastExport)

  async function onImport(file: File) {
    try {
      const backup = parseBackup(await file.text())
      const n = backup.workouts.length
      if (!confirm(`Importere backup fra ${backup.exportedAt.slice(0, 10)} med ${n} økter? ALLE nåværende data erstattes.`)) return
      await restoreBackup(backup)
      setMsg('Backup importert.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import feilet.')
    }
  }

  return (
    <>
      <h1>Innstillinger</h1>

      <section className="card form">
        <h2>Program</h2>
        <select className="select" value={settings.activeProgramId} onChange={(e) => updateSettings({ activeProgramId: e.target.value })}>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="list">
          {programs.map((p) => (
            <button key={p.id} className="list-item" onClick={() => setEdit({ kind: 'program', program: p })}>
              <span>{p.name}</span>
              <span className="muted small">{p.sessions.length} økter · rediger ›</span>
            </button>
          ))}
        </div>
        <button className="btn small ghost" onClick={() => setEdit({ kind: 'program', program: blankProgram() })}>
          + Nytt program
        </button>
      </section>

      <section className="card form">
        <h2>Kroppsvekt</h2>
        <div className="form-row">
          <label className="grow">
            Startvekt
            <Stepper value={settings.startWeight} step={0.5} unit="kg" onChange={(v) => updateSettings({ startWeight: v })} />
          </label>
          <label className="grow">
            Målvekt
            <Stepper value={settings.goalWeight} step={0.5} unit="kg" onChange={(v) => updateSettings({ goalWeight: v })} />
          </label>
        </div>
        <label>
          Mål-tempo (kg per uke, tomt = av)
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.05"
            placeholder="f.eks. 0,25"
            value={settings.targetRate ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(',', '.')
              updateSettings({ targetRate: v === '' ? null : Number(v) })
            }}
          />
        </label>
      </section>

      <section className="card form">
        <h2>Trening</h2>
        <label className="check">
          <input type="checkbox" checked={settings.techniquePhase} onChange={(e) => updateSettings({ techniquePhase: e.target.checked })} />
          Teknikkfase (mål RIR 2–3 de første 14 dagene)
        </label>
        <p className="muted small">
          {settings.firstWorkoutDate ? `Første økt: ${settings.firstWorkoutDate}. ` : 'Ingen økter ennå. '}
          {technique ? 'Du er i teknikkfasen nå.' : 'Teknikkfasen er over eller slått av.'}
        </p>
        <div className="form-row">
          <label className="grow">
            Pause flerledd
            <Stepper value={settings.restCompound} step={15} unit="sek" onChange={(v) => setGlobalRest('flerledd', v)} />
          </label>
          <label className="grow">
            Pause isolasjon
            <Stepper value={settings.restIsolation} step={15} unit="sek" onChange={(v) => setGlobalRest('isolasjon', v)} />
          </label>
        </div>
        <p className="muted small">Gjelder alle øvelser som ikke har egen pausetid.</p>
      </section>

      <section className="card form">
        <h2>Øvelser</h2>
        <button className="btn small ghost" onClick={() => setShowExercises((s) => !s)}>
          {showExercises ? 'Skjul' : `Vis alle ${exercises.length}`}
        </button>
        {showExercises && (
          <div className="list">
            {[...exercises]
              .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
              .map((e) => (
                <button key={e.id} className="list-item" onClick={() => setEdit({ kind: 'exercise', exercise: e })}>
                  <span>{e.name}</span>
                  <span className="muted small">
                    {kg(e.step)} · {e.rest} s ›
                  </span>
                </button>
              ))}
          </div>
        )}
        <button className="btn small ghost" onClick={() => setEdit({ kind: 'exercise', exercise: blankExercise(settings.restCompound) })}>
          + Ny øvelse
        </button>
        <button
          className="btn small ghost danger"
          onClick={async () => {
            if (!confirm('Tilbakestille standardøvelser og de to standardprogrammene? Egne øvelser, egne programmer og all historikk beholdes.'))
              return
            await resetDefaults()
            setMsg('Standardøvelser og -programmer er tilbakestilt.')
          }}
        >
          Tilbakestill til standard
        </button>
      </section>

      <section className="card form">
        <h2>Backup</h2>
        <p className="muted small">
          {since === null ? 'Du har ikke eksportert ennå.' : `Siste eksport: for ${since} dager siden.`} All data ligger bare på
          denne telefonen – ta backup jevnlig.
        </p>
        <button className="btn primary full" onClick={() => exportJson()}>
          Eksporter alt (JSON)
        </button>
        <button className="btn full" onClick={() => exportCsv()}>
          Eksporter sett og kroppsvekt (CSV)
        </button>
        <button className="btn full" onClick={() => fileRef.current?.click()}>
          Importer backup …
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onImport(f)
          }}
        />
        {msg && <p className="warn small">{msg}</p>}
      </section>
    </>
  )
}

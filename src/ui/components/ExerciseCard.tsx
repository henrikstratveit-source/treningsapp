import { useState } from 'react'
import { MSG_FIRST, suggest, type Performance } from '../../domain/progression'
import { shortcutUrl } from '../../domain/shortcut'
import { formatRir, targetRir } from '../../domain/rir'
import type { Exercise, PlannedSlot, SetEntry, WorkoutSession } from '../../domain/types'
import { warmupSets } from '../../domain/warmup'
import { isDumbbell, slotProgress } from '../../domain/workout'
import { deleteSet, newId, saveSet, startRest, swapExercise } from '../../data/repo'
import { kg, repsList } from '../format'
import { unlockAudio } from '../sound'
import { Goal } from './Goal'
import { SetEditor, type SetValues } from './SetEditor'

interface Props {
  workout: WorkoutSession
  slot: PlannedSlot
  exercise: Exercise
  /** Øvelser det kan byttes til (inkludert originalen), uten den aktive */
  swapOptions: Exercise[]
  optional: boolean
  history: Performance[]
  technique: boolean
  firstCompound: boolean
  /** Snarvei som starter iPhone-timer, eller null */
  shortcut: string | null
  /** Øvelsen som er i fokus vises åpen; de andre som en smal linje */
  focused: boolean
  /** Sett lagt til (+) eller fjernet (−) i denne økta */
  extra: number
  onExtra: (delta: number) => void
  onFocus: () => void
  onBlur: () => void
  /** Kalles når siste sett-rad er logget */
  onCompleted: () => void
}

export function ExerciseCard({
  workout,
  slot,
  exercise,
  swapOptions,
  optional,
  history,
  technique,
  firstCompound,
  shortcut,
  focused,
  extra,
  onExtra,
  onFocus,
  onBlur,
  onCompleted,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [swapOpen, setSwapOpen] = useState(false)

  const s = suggest(history, { step: exercise.step, repMin: slot.repMin, techniquePhase: technique })
  const mine = workout.sets.filter((x) => x.slotIndex === slot.slotIndex && x.exerciseId === exercise.id)
  const work = mine.filter((x) => !x.warmup)
  const warmLogged = mine.filter((x) => x.warmup)
  const { rows, done } = slotProgress(workout, slot, extra)
  const unit = isDumbbell(exercise.id) ? 'kg/man.' : 'kg'
  const warmups = warmupSets(exercise.type, s.weight, exercise.step, firstCompound)
  const last = history[history.length - 1]

  const rirFor = (i: number) => formatRir(targetRir(exercise.type, i + 1, rows, technique))

  function prefill(i: number): SetValues {
    const prev = work[work.length - 1]
    const weight = prev?.weight ?? s.weight ?? 0
    let reps: number
    if (s.kind === 'hold') reps = s.previousReps[i] ?? s.previousReps[s.previousReps.length - 1] ?? slot.repMin
    else reps = s.targetReps ?? prev?.reps ?? slot.repMin
    return { weight, reps, rir: null, goodForm: true }
  }

  function targetLabel(i: number) {
    const parts = [`Sett ${i + 1}`]
    if (s.kind === 'hold' && s.previousReps[i] !== undefined) parts.push(`forrige ${s.previousReps[i]}`)
    else if (s.targetReps) parts.push(`mål ${s.targetReps}+`)
    parts.push(rirFor(i))
    return parts.join(' · ')
  }

  async function save(i: number, v: SetValues, existing?: SetEntry) {
    const entry: SetEntry = {
      id: existing?.id ?? newId(),
      exerciseId: exercise.id,
      slotIndex: slot.slotIndex,
      setNumber: existing?.setNumber ?? i + 1,
      weight: v.weight,
      reps: v.reps,
      rir: v.rir,
      warmup: false,
      goodForm: v.goodForm,
      time: existing?.time ?? new Date().toISOString(),
    }
    if (existing) {
      await saveSet(workout.id, entry)
      setEditing(null)
      return
    }
    unlockAudio()
    const saved = Promise.all([saveSet(workout.id, entry), startRest(exercise.rest)])
    // Åpnes direkte i trykket (iOS krever brukerhandling). Lagringen er allerede i gang.
    if (shortcut) window.location.href = shortcutUrl(shortcut, exercise.rest)
    await saved
    setEditing(null)
    if (work.length + 1 >= rows) onCompleted()
  }

  async function logWarmup(weight: number, reps: number) {
    await saveSet(workout.id, {
      id: newId(),
      exerciseId: exercise.id,
      slotIndex: slot.slotIndex,
      setNumber: warmLogged.length + 1,
      weight,
      reps,
      rir: null,
      warmup: true,
      goodForm: true,
      time: new Date().toISOString(),
    })
  }

  if (!focused) {
    const w = work[0]?.weight
    const same = work.every((x) => x.weight === w)
    let detail: string
    if (done) detail = same ? `${kg(w)} × ${repsList(work.map((x) => x.reps))}` : work.map((x) => `${kg(x.weight)} × ${x.reps}`).join(', ')
    else if (work.length > 0) detail = `${work.length} av ${rows} sett`
    else detail = `${rows} × ${slot.repMin}–${slot.repMax}${s.weight !== null ? ` · ${kg(s.weight)}` : ''}${optional ? ' · valgfri' : ''}`
    return (
      <button className={`card exercise compact ${done ? 'is-done' : ''}`} data-slot={slot.slotIndex} onClick={onFocus}>
        <span className={done ? 'compact-check' : 'compact-dot'}>{done ? '✓' : work.length > 0 ? '◐' : '○'}</span>
        <span className="compact-text">
          <strong>{exercise.name}</strong>
          <span className="muted small">{detail}</span>
        </span>
        <span className="muted">›</span>
      </button>
    )
  }

  return (
    <section className={`card exercise focused ${done ? 'is-done' : ''}`} data-slot={slot.slotIndex}>
      <header className="ex-head">
        <h2>
          {exercise.name} {optional && <span className="tag">valgfri</span>}
          {done && <span className="tag good">ferdig</span>}
        </h2>
        {done && (
          <button className="btn small ghost" onClick={onBlur}>
            Skjul
          </button>
        )}
        {swapOptions.length > 0 && (
          <button className="btn small ghost" onClick={() => setSwapOpen((o) => !o)}>
            Bytt
          </button>
        )}
      </header>

      {swapOpen && (
        <div className="swap">
          {swapOptions.map((o) => (
            <button
              key={o.id}
              className="btn"
              onClick={async () => {
                await swapExercise(workout.id, slot.slotIndex, o.id)
                setSwapOpen(false)
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      <Goal s={s} repMin={slot.repMin} repMax={slot.repMax} unit={unit} />
      {last && (
        <p className="muted small">
          Forrige gang: {kg(s.previousWeight!)} × {repsList(s.previousReps)}
        </p>
      )}
      {s.messages
        .filter((m) => m !== MSG_FIRST)
        .map((m) => (
          <p key={m} className="warn small">
            {m}
          </p>
        ))}
      {unit !== 'kg' && <p className="muted small">Vekt per manual.</p>}

      {warmups.length > 0 && (
        <div className="warmups">
          {warmups.map((w, j) =>
            j < warmLogged.length ? (
              <div key={j} className="set-done warm">
                <span>Oppv.</span>
                <span>
                  {kg(warmLogged[j].weight)} × {warmLogged[j].reps}
                </span>
                <button className="btn small ghost" onClick={() => deleteSet(workout.id, warmLogged[j].id)}>
                  ×
                </button>
              </div>
            ) : (
              <button key={j} className="btn warm-btn" onClick={() => logWarmup(w.weight, w.reps)}>
                Oppvarming: {kg(w.weight)} × {w.reps} – logg
              </button>
            ),
          )}
        </div>
      )}

      {Array.from({ length: rows }, (_, i) => {
        const entry = work[i]
        if (entry && editing !== entry.id) {
          return (
            <div key={entry.id} className="set-done" onClick={() => setEditing(entry.id)}>
              <span className="muted">{i + 1}</span>
              <span>
                {kg(entry.weight)} × {entry.reps}
              </span>
              <span className="muted small">
                {entry.rir !== null && `RIR ${entry.rir === 4 ? '4+' : entry.rir}`}
                {!entry.goodForm && ' · dårlig form'}
              </span>
              <button
                className="btn small ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Slette settet?')) void deleteSet(workout.id, entry.id)
                }}
              >
                ×
              </button>
            </div>
          )
        }
        if (entry) {
          return (
            <SetEditor
              key={entry.id}
              initial={{ weight: entry.weight, reps: entry.reps, rir: entry.rir, goodForm: entry.goodForm }}
              step={exercise.step}
              weightUnit={unit}
              targetLabel={targetLabel(i)}
              onSave={(v) => save(i, v, entry)}
              onCancel={() => setEditing(null)}
            />
          )
        }
        if (i === work.length) {
          return (
            <SetEditor
              key={`new-${i}-${work.length}`}
              initial={prefill(i)}
              step={exercise.step}
              weightUnit={unit}
              targetLabel={targetLabel(i)}
              onSave={(v) => save(i, v)}
            />
          )
        }
        return (
          <div key={`p${i}`} className="set-pending muted small">
            {targetLabel(i)}
          </div>
        )
      })}

      <div className="row-actions">
        <button className="btn small ghost" disabled={rows <= Math.max(1, work.length)} onClick={() => onExtra(-1)}>
          − Sett
        </button>
        <button className="btn small ghost" onClick={() => onExtra(1)}>
          + Sett
        </button>
      </div>
    </section>
  )
}

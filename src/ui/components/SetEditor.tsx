import { useState } from 'react'
import type { Rir } from '../../domain/types'

interface StepperProps {
  value: number
  step: number
  unit: string
  onChange: (v: number) => void
}

export function Stepper({ value, step, unit, onChange }: StepperProps) {
  const set = (v: number) => onChange(Math.max(0, Math.round(v * 100) / 100))
  return (
    <div className="stepper">
      <button className="btn step" onClick={() => set(value - step)} aria-label={`minus ${step}`}>
        −
      </button>
      <label className="stepper-value">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => set(Number(e.target.value.replace(',', '.')) || 0)}
          onFocus={(e) => e.target.select()}
        />
        <span className="unit">{unit}</span>
      </label>
      <button className="btn step" onClick={() => set(value + step)} aria-label={`pluss ${step}`}>
        +
      </button>
    </div>
  )
}

const RIRS: Rir[] = [0, 1, 2, 3, 4]

export function RirButtons({ value, onChange }: { value: Rir | null; onChange: (v: Rir | null) => void }) {
  return (
    <div className="rir">
      <span className="muted small">RIR</span>
      {RIRS.map((r) => (
        <button key={r} className={`chip ${value === r ? 'on' : ''}`} onClick={() => onChange(value === r ? null : r)}>
          {r === 4 ? '4+' : r}
        </button>
      ))}
    </div>
  )
}

export interface SetValues {
  weight: number
  reps: number
  rir: Rir | null
  goodForm: boolean
}

interface SetEditorProps {
  initial: SetValues
  step: number
  weightUnit: string
  targetLabel: string
  saveLabel?: string
  onSave: (v: SetValues) => void
  onCancel?: () => void
}

/** Rad for å logge ett sett: vekt, reps, RIR, god form og lagre. */
export function SetEditor({ initial, step, weightUnit, targetLabel, saveLabel = 'Lagre', onSave, onCancel }: SetEditorProps) {
  const [v, setV] = useState(initial)
  const upd = (p: Partial<SetValues>) => setV((x) => ({ ...x, ...p }))
  return (
    <div className="set-editor">
      <div className="set-target muted small">{targetLabel}</div>
      <div className="set-inputs">
        <Stepper value={v.weight} step={step} unit={weightUnit} onChange={(weight) => upd({ weight })} />
        <Stepper value={v.reps} step={1} unit="reps" onChange={(reps) => upd({ reps: Math.round(reps) })} />
      </div>
      <RirButtons value={v.rir} onChange={(rir) => upd({ rir })} />
      <div className="set-actions">
        <label className="check">
          <input type="checkbox" checked={v.goodForm} onChange={(e) => upd({ goodForm: e.target.checked })} />
          God form
        </label>
        {onCancel && (
          <button className="btn ghost" onClick={onCancel}>
            Avbryt
          </button>
        )}
        <button className="btn primary" disabled={v.reps <= 0 || v.weight <= 0} onClick={() => onSave(v)}>
          {saveLabel}
        </button>
      </div>
    </div>
  )
}

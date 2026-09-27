import type { Suggestion } from '../../domain/progression'
import { describeSuggestion, kg } from '../format'

/** Tydelig boks øverst på øvelsen: hvilken vekt og hvor mange reps i dag. */
export function Goal({ s, repMin, repMax, unit }: { s: Suggestion; repMin: number; repMax: number; unit: string }) {
  if (s.kind === 'first') {
    return (
      <div className="goal">
        <div className="goal-label">Første gang</div>
        <div className="goal-main">Velg vekt</div>
        <div className="goal-sub">{describeSuggestion(s, repMin, repMax)}</div>
      </div>
    )
  }

  const w = kg(s.weight!).replace(' kg', '')
  const unitLabel = unit === 'kg' ? 'kg' : 'kg per manual'
  const labels = {
    increase: { label: 'Øk vekta ↑', cls: 'up' },
    hold: { label: 'Samme vekt', cls: '' },
    tooHeavy: { label: 'For tungt sist – ned igjen', cls: 'down' },
    deload: { label: 'Ned og bygg opp igjen', cls: 'down' },
  } as const
  const { label, cls } = labels[s.kind]

  return (
    <div className={`goal ${cls}`}>
      <div className="goal-label">{label}</div>
      <div className="goal-main">
        {w} <span className="goal-unit">{unitLabel}</span>
        {s.targetReps !== null && <span className="goal-reps"> × {s.targetReps}+</span>}
      </div>
      <div className="goal-sub">
        {s.kind === 'hold'
          ? `Slå forrige gang: minst ${s.targetTotal} reps totalt.`
          : s.kind === 'increase'
            ? `Du nådde ${repMax} på alle sett med ${kg(s.previousWeight!)}. Mål nå ${s.targetReps} reps per sett, så bygg opp mot ${repMax} igjen.`
            : `Mål ${s.targetReps} reps per sett, bygg opp mot ${repMax}.`}
      </div>
    </div>
  )
}

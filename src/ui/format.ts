import type { Suggestion } from '../domain/progression'

export const kg = (n: number) => `${String(n).replace('.', ',')} kg`

export const repsList = (reps: number[]) => reps.join(' · ')

/** Kort tekst om hva som gjelder denne gangen. */
export function describeSuggestion(s: Suggestion, repMin: number, repMax: number): string {
  switch (s.kind) {
    case 'first':
      return `Første gang: velg en vekt du tror du klarer i øvre del av ${repMin}–${repMax} reps med 2–3 reps igjen.`
    case 'increase':
      return `Øk vekta: ${kg(s.weight!)} – mål ${s.targetReps} reps på alle sett (område ${repMin}–${repMax}).`
    case 'tooHeavy':
      return `For tungt sist. Tilbake til ${kg(s.weight!)}.`
    case 'deload':
      return `Stått stille lenge. Gå ned til ${kg(s.weight!)} og bygg opp igjen.`
    case 'hold':
      return `Hold ${kg(s.weight!)} – slå forrige: minst ${s.targetTotal} reps totalt.`
  }
}

/** Kort tekst for sammendraget etter økta: hva skjer neste gang. */
export function describeNext(s: Suggestion): string {
  switch (s.kind) {
    case 'increase':
      return `Øker til ${kg(s.weight!)} neste gang`
    case 'tooHeavy':
      return `Tilbake til ${kg(s.weight!)} neste gang`
    case 'deload':
      return `Ned til ${kg(s.weight!)} neste gang`
    case 'hold':
      return `Hold ${kg(s.weight!)}, mål minst ${s.targetTotal} reps`
    case 'first':
      return ''
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })
}

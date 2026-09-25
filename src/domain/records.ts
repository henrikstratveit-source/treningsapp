// Personlige rekorder (svar 12): ny høyeste arbeidsvekt eller ny beste estimert 1RM (Epley).
import { isValidWorkSet, type Performance } from './progression'
import { epley } from './rounding'

export interface RecordResult {
  weight: boolean
  e1rm: boolean
  bestWeight: number
  bestE1rm: number
}

function best(p: Performance) {
  const sets = p.entries.filter(isValidWorkSet)
  return {
    weight: Math.max(...sets.map((s) => s.weight)),
    e1rm: Math.max(...sets.map((s) => epley(s.weight, s.reps))),
  }
}

/** Sammenlign siste gang med alle tidligere. Ingen rekord første gang øvelsen gjøres. */
export function records(history: Performance[]): RecordResult | null {
  if (history.length < 2) return null
  const cur = best(history[history.length - 1])
  const before = history.slice(0, -1).map(best)
  const w = cur.weight > Math.max(...before.map((b) => b.weight))
  const e = cur.e1rm > Math.max(...before.map((b) => b.e1rm)) + 1e-9
  if (!w && !e) return null
  return { weight: w, e1rm: e, bestWeight: cur.weight, bestE1rm: Math.round(cur.e1rm * 10) / 10 }
}

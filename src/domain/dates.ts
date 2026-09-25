// Datohjelpere. Datoer er 'YYYY-MM-DD' i lokal tid. Uke = mandag–søndag.

const pad = (n: number) => String(n).padStart(2, '0')

/** Lokal dato ('YYYY-MM-DD') for et Date-objekt eller ISO-tidspunkt. */
export function localDate(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

function parse(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: string, days: number): string {
  const d = parse(date)
  d.setDate(d.getDate() + days)
  return localDate(d)
}

/** Antall hele dager fra a til b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000)
}

/** Mandagen i uka datoen ligger i. */
export function mondayOf(date: string): string {
  const day = parse(date).getDay() // 0 = søndag
  return addDays(date, -((day + 6) % 7))
}

/** Avrund til nærmeste multiplum av steget (f.eks. 2,5 kg). */
export function roundToStep(value: number, step: number): number {
  return Math.round(Math.round(value / step) * step * 100) / 100
}

/** Estimert 1RM (Epley). */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

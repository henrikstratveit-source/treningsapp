// Lyd og vibrasjon når pausen er ferdig. iOS krever at lyd låses opp av et trykk,
// så unlockAudio() kalles når et sett lagres. iPhone har ikke vibrasjon i nettleseren.

let ctx: AudioContext | null = null

export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // Ingen lyd tilgjengelig
  }
}

export function beep() {
  try {
    if (!ctx) return
    const t = ctx.currentTime
    for (const offset of [0, 0.25, 0.5]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, t + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + offset)
      osc.stop(t + offset + 0.2)
    }
  } catch {
    // ignorer
  }
  navigator.vibrate?.([300, 150, 300])
}

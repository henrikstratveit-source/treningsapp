import { useEffect, useRef, useState } from 'react'
import type { Settings } from '../../domain/types'
import { clearRest, extendRest } from '../../data/repo'
import { beep } from '../sound'

/** Gjenstående sekunder regnes ut fra lagret starttidspunkt (SPEC 9). */
function remaining(rest: NonNullable<Settings['activeRest']>, now: number) {
  return Math.ceil(rest.seconds - (now - new Date(rest.start).getTime()) / 1000)
}

export const formatSeconds = (s: number) => {
  const a = Math.abs(s)
  return `${s < 0 ? '−' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`
}

export function RestTimer({ rest }: { rest: Settings['activeRest'] }) {
  const [now, setNow] = useState(() => Date.now())
  const beeped = useRef<string | null>(null)

  useEffect(() => {
    if (!rest) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [rest])

  const left = rest ? remaining(rest, now) : 0
  const key = rest ? `${rest.start}|${rest.seconds}` : null

  useEffect(() => {
    // Pip bare hvis tida gikk ut nå nettopp (ikke når appen åpnes lenge etterpå).
    if (rest && left <= 0 && left > -5 && beeped.current !== key) {
      beeped.current = key
      beep()
    }
  }, [rest, left, key])

  if (!rest) return null
  const done = left <= 0
  const pct = Math.max(0, Math.min(1, left / rest.seconds))

  return (
    <div className={`rest ${done ? 'done' : ''}`}>
      <div className="rest-bar" style={{ width: `${pct * 100}%` }} />
      <div className="rest-row">
        <div>
          <div className="rest-label">{done ? 'Pausen er ferdig' : 'Pause'}</div>
          <div className="rest-time">{formatSeconds(left)}</div>
        </div>
        <button className="btn small" onClick={() => extendRest(30)}>
          +30 s
        </button>
        <button className="btn small" onClick={() => clearRest()}>
          {done ? 'Lukk' : 'Hopp over'}
        </button>
      </div>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { localDate } from '../../domain/dates'
import { exerciseHistory } from '../../domain/progression'
import { inTechniquePhase } from '../../domain/rir'
import { activeShortcut } from '../../domain/shortcut'
import type { Exercise } from '../../domain/types'
import { db } from '../../data/db'
import { discardWorkout, finishWorkout } from '../../data/repo'
import { ExerciseCard, scrollToNextExercise } from '../components/ExerciseCard'

interface Props {
  workoutId: string
  onFinished: (id: string) => void
  onClose: () => void
}

function useMinutesSince(iso: string | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000)) : 0
}

export function Workout({ workoutId, onFinished, onClose }: Props) {
  const data = useLiveQuery(async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return { workout: undefined }
    const [program, exercises, settings, all] = await Promise.all([
      db.programs.get(workout.programId),
      db.exercises.toArray(),
      db.settings.get('settings'),
      db.workouts.toArray(),
    ])
    return { workout, program, exercises, settings, all }
  }, [workoutId])
  const minutes = useMinutesSince(data?.workout?.start)
  // Påbegynt økt: start ved første uferdige øvelse.
  const scrolled = useRef(false)
  useEffect(() => {
    if (scrolled.current || !data?.workout) return
    scrolled.current = true
    if (data.workout.sets.some((s) => !s.warmup)) scrollToNextExercise()
  }, [data])

  if (!data) return <p className="muted">Laster …</p>
  const { workout, program, exercises, settings, all } = data
  if (!workout || !exercises || !settings || !all) {
    return (
      <>
        <p className="muted">Fant ikke økta.</p>
        <button className="btn" onClick={onClose}>
          Tilbake
        </button>
      </>
    )
  }

  const exMap = new Map(exercises.map((e) => [e.id, e]))
  const session = program?.sessions.find((s) => s.id === workout.sessionId)
  const technique = inTechniquePhase(settings.techniquePhase, settings.firstWorkoutDate, localDate(new Date()))
  const others = all.filter((w) => w.id !== workout.id)
  const firstCompoundSlot = workout.plan.find((p) => exMap.get(p.exerciseId)?.type === 'flerledd')?.slotIndex
  const workSets = workout.sets.filter((s) => !s.warmup).length

  async function finish() {
    if (workSets === 0) {
      if (confirm('Ingen arbeidssett logget. Slette økta?')) {
        await discardWorkout(workout!.id)
        onClose()
      }
      return
    }
    if (!confirm('Avslutte økta?')) return
    await finishWorkout(workout!.id)
    onFinished(workout!.id)
  }

  async function discard() {
    if (!confirm('Slette hele økta og alle sett?')) return
    await discardWorkout(workout!.id)
    onClose()
  }

  return (
    <>
      <div className="workout-head">
        <button className="btn small ghost" onClick={onClose}>
          ‹ Hjem
        </button>
        <div className="grow">
          <h1>{session?.name ?? 'Økt'}</h1>
          <p className="muted small">
            {minutes} min · {workSets} sett{technique && ' · teknikkfase'}
          </p>
        </div>
        <button className="btn primary" onClick={finish}>
          Avslutt
        </button>
      </div>

      {workout.plan.map((slot) => {
        const ex = exMap.get(slot.exerciseId)
        if (!ex) return null
        const programSlot = session?.slots[slot.slotIndex]
        const optionIds = programSlot ? [programSlot.exerciseId, ...programSlot.alternatives] : []
        const swapOptions = optionIds
          .filter((id) => id !== ex.id)
          .map((id) => exMap.get(id))
          .filter((e): e is Exercise => !!e)
        return (
          <ExerciseCard
            key={`${slot.slotIndex}-${ex.id}`}
            workout={workout}
            slot={slot}
            exercise={ex}
            swapOptions={swapOptions}
            optional={programSlot?.optional ?? false}
            history={exerciseHistory(ex.id, others)}
            technique={technique}
            firstCompound={slot.slotIndex === firstCompoundSlot}
            shortcut={activeShortcut(settings)}
          />
        )
      })}

      <button className="btn big primary" onClick={finish}>
        Avslutt økt
      </button>
      <button className="btn ghost danger full" onClick={discard}>
        Slett økta
      </button>
    </>
  )
}

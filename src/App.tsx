import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from './data/db'
import { RestTimer } from './ui/components/RestTimer'
import { Bodyweight } from './ui/screens/Bodyweight'
import { History } from './ui/screens/History'
import { Home } from './ui/screens/Home'
import { Summary } from './ui/screens/Summary'
import { Workout } from './ui/screens/Workout'

type Tab = 'hjem' | 'historikk' | 'vekt' | 'statistikk' | 'innstillinger'
type View = { kind: 'tabs' } | { kind: 'workout'; id: string } | { kind: 'summary'; id: string }

const tabs: { id: Tab; label: string }[] = [
  { id: 'hjem', label: 'Hjem' },
  { id: 'historikk', label: 'Historikk' },
  { id: 'vekt', label: 'Vekt' },
  { id: 'statistikk', label: 'Statistikk' },
  { id: 'innstillinger', label: 'Innst.' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('hjem')
  const [view, setView] = useState<View>({ kind: 'tabs' })
  const rest = useLiveQuery(async () => (await db.settings.get('settings'))?.activeRest ?? null)
  const home = () => {
    setView({ kind: 'tabs' })
    setTab('hjem')
  }

  let content
  if (view.kind === 'workout') {
    content = <Workout workoutId={view.id} onFinished={(id) => setView({ kind: 'summary', id })} onClose={home} />
  } else if (view.kind === 'summary') {
    content = <Summary workoutId={view.id} onDone={home} />
  } else if (tab === 'hjem') {
    content = <Home onOpenWorkout={(id) => setView({ kind: 'workout', id })} />
  } else if (tab === 'historikk') {
    content = <History />
  } else if (tab === 'vekt') {
    content = <Bodyweight />
  } else {
    content = <p className="muted">Kommer i en senere milepæl.</p>
  }

  return (
    <div className="app">
      <RestTimer rest={rest ?? null} />
      <main className="content">{content}</main>
      {view.kind === 'tabs' && (
        <nav className="tabbar">
          {tabs.map((t) => (
            <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

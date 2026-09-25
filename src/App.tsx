import { useState } from 'react'
import { Home } from './ui/screens/Home'

type Tab = 'hjem' | 'historikk' | 'vekt' | 'statistikk' | 'innstillinger'

const tabs: { id: Tab; label: string }[] = [
  { id: 'hjem', label: 'Hjem' },
  { id: 'historikk', label: 'Historikk' },
  { id: 'vekt', label: 'Vekt' },
  { id: 'statistikk', label: 'Statistikk' },
  { id: 'innstillinger', label: 'Innst.' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('hjem')
  return (
    <div className="app">
      <main className="content">
        {tab === 'hjem' ? <Home /> : <p className="muted">Kommer i en senere milepæl.</p>}
      </main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

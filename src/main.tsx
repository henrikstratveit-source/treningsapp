import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { requestPersistentStorage } from './data/db'
import './theme.css'
import './theme-ny.css'
import { applyTheme, initialTheme } from './ui/theme'

applyTheme(initialTheme())

requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

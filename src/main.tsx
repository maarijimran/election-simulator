import { createRoot } from 'react-dom/client'
import App from './App'
import { applyStoredTheme } from './game/theme'
import './styles.css'

applyStoredTheme()

createRoot(document.getElementById('root')!).render(<App />)

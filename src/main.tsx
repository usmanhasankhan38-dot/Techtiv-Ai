import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/buttons.css'
import './styles/theme.css'
import './styles/semantic.css'
import './styles/liquid-glass.css'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/router'
import { ThemeProvider } from './contexts/ThemeContext'


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster position="bottom-center" toastOptions={{ style: { background: 'var(--theme-inverse-canvas)', color: 'var(--theme-inverse-ink)', borderRadius: '6px' } }} />
        <AppRoutes />
      </Router>
    </ThemeProvider>
  )
}

export default App

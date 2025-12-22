import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { routes } from './app/router'

function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import IntroAnimation from './components/IntroAnimation'
import AppHeader from './components/AppHeader'
import AnalyzePage from './pages/AnalyzePage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('marko-debug-mode')
    if (saved === 'true') setDebugMode(true)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('marko-debug-mode', debugMode ? 'true' : 'false')
  }, [debugMode])

  return (
    <BrowserRouter>
      <IntroAnimation>
        <div className="min-h-screen bg-bg flex flex-col">
          <AppHeader debugMode={debugMode} onDebugModeChange={setDebugMode} />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<AnalyzePage debugMode={debugMode} />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </IntroAnimation>
    </BrowserRouter>
  )
}

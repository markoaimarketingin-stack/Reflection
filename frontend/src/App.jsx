import { BrowserRouter, Route, Routes } from 'react-router-dom'

import IntroAnimation from './components/IntroAnimation'
import AppHeader from './components/AppHeader'
import AnalyzePage from './pages/AnalyzePage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <IntroAnimation>
        <div className="min-h-screen bg-bg flex flex-col">
          <AppHeader />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </IntroAnimation>
    </BrowserRouter>
  )
}

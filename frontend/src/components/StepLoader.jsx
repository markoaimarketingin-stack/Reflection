import { useEffect, useMemo, useState } from 'react'

const STEPS = [
  'Analyzing campaign',
  'Detecting patterns',
  'Generating insights',
  'Preparing recommendations',
]

const TOTAL_DURATION_MS = 30000
const TICK_MS = 300

export default function StepLoader() {
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const startedAt = Date.now()

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, Math.max(1, Math.ceil((elapsed / TOTAL_DURATION_MS) * 100)))
      setProgress(nextProgress)
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  const currentStep = useMemo(() => {
    if (progress <= 24) return STEPS[0]
    if (progress <= 49) return STEPS[1]
    if (progress <= 74) return STEPS[2]
    return STEPS[3]
  }, [progress])

  return (
    <div className="step-loader-card">
      <div className="workspace-section-label">Processing Analysis</div>

      <div className="step-loader-hero">
        <div className="diamond-loader" aria-hidden="true">
          <figure>
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} style={{ '--i': index + 1 }} />
            ))}
          </figure>
        </div>
      </div>

      <div className="step-loader-status">
        {currentStep} {progress}%
      </div>
    </div>
  )
}

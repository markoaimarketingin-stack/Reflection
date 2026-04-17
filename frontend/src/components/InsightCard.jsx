import { useState } from 'react'
import { ChevronDown, Copy } from 'lucide-react'
import { Tag } from './ui'

function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

export default function InsightCard({ insights }) {
  const [showLearnings, setShowLearnings] = useState(true)
  const [showAnomalies, setShowAnomalies] = useState(true)

  return (
    <div className="insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="insight-card-eyebrow">Primary Insight</div>
          <div className="insight-card-title">Narrative Summary</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag color={insights.source === 'openai' ? 'blue' : 'default'}>
            {insights.source === 'openai' ? 'GPT-powered' : 'Deterministic'}
          </Tag>
          <button
            type="button"
            className="results-action-button"
            onClick={() => copyText(insights.narrative_summary || '')}
            aria-label="Copy insight"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      <p className="insight-card-summary">{insights.narrative_summary}</p>

      {insights.key_learnings?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button type="button" className="results-collapse-button" onClick={() => setShowLearnings(value => !value)}>
            <span className="insight-card-eyebrow" style={{ marginBottom: 0 }}>Key Learnings</span>
            <ChevronDown size={14} className={showLearnings ? 'recommendation-why-icon recommendation-why-icon-open' : 'recommendation-why-icon'} />
          </button>
          {showLearnings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {insights.key_learnings.map((item, index) => (
                <div key={index} className="insight-card-learning">
                  <span className="insight-card-bullet">+</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {insights.anomalies?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button type="button" className="results-collapse-button" onClick={() => setShowAnomalies(value => !value)}>
            <span className="insight-card-eyebrow" style={{ marginBottom: 0 }}>Anomalies</span>
            <ChevronDown size={14} className={showAnomalies ? 'recommendation-why-icon recommendation-why-icon-open' : 'recommendation-why-icon'} />
          </button>
          {showAnomalies && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {insights.anomalies.map((item, index) => (
                <div key={index} className="insight-card-anomaly">
                  <span className="insight-card-bullet">!</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

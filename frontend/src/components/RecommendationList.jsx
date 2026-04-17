import { useState } from 'react'
import { ChevronDown, Copy } from 'lucide-react'

function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

export default function RecommendationList({ items = [], whyReasons = [] }) {
  const [openIndex, setOpenIndex] = useState(0)

  if (!items.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, index) => (
        <div key={index} className="recommendation-item recommendation-item-stack">
          <div className="recommendation-row">
            <span className="recommendation-index">{index + 1}</span>
            <span className="recommendation-text">{item}</span>
            <button
              type="button"
              className="results-action-button"
              onClick={() => copyText(item)}
              aria-label="Copy recommendation"
            >
              <Copy size={14} />
            </button>
          </div>

          <button
            type="button"
            className="recommendation-why-toggle"
            onClick={() => setOpenIndex(current => (current === index ? -1 : index))}
          >
            <span>Why this recommendation</span>
            <ChevronDown
              size={14}
              className={openIndex === index ? 'recommendation-why-icon recommendation-why-icon-open' : 'recommendation-why-icon'}
            />
          </button>

          {openIndex === index && (
            <div className="recommendation-why-copy">
              {whyReasons[index % Math.max(1, whyReasons.length)] || 'Driven by the current campaign gaps and the strongest signals in this analysis.'}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function MetricCard({ label, value, delta, positive }) {
  const toneClass = positive == null ? '' : positive ? 'metric-card-positive' : 'metric-card-negative'

  return (
    <div className={`metric-card ${toneClass}`.trim()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <span className="metric-card-label">{label}</span>
        {delta != null && (
          <span className={positive ? 'metric-card-delta metric-card-delta-positive' : 'metric-card-delta metric-card-delta-negative'}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="metric-card-value">{value}</div>
    </div>
  )
}

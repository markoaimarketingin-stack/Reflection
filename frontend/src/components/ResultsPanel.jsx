import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Copy, Download, Lightbulb, Radar, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, SectionTitle, Tag, ScoreBar, ImpactBar, EmptyState } from './ui'
import MetricCard from './MetricCard'
import InsightCard from './InsightCard'
import RecommendationList from './RecommendationList'
import { exportResultsPDF } from '../lib/ExportPDF'

function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

function ResultsHero({ topInsight, biggestIssue, onExport, onCopy }) {
  return (
    <div className="results-hero-grid">
      <div className="results-highlight-card">
        <div className="results-highlight-top">
          <div className="results-highlight-icon">
            <Sparkles size={16} />
          </div>
          <div className="results-highlight-label">Top Insight</div>
          <button type="button" className="results-action-button results-export-hide" onClick={onCopy} aria-label="Copy top insight">
            <Copy size={14} />
          </button>
        </div>
        <div className="results-highlight-title">{topInsight?.title || 'Strongest takeaway'}</div>
        <p className="results-highlight-body">{topInsight?.body || 'No primary insight available yet.'}</p>
      </div>

      <div className="results-highlight-card results-highlight-card-danger">
        <div className="results-highlight-top">
          <div className="results-highlight-icon results-highlight-icon-danger">
            <AlertTriangle size={16} />
          </div>
          <div className="results-highlight-label">Biggest Issue</div>
          <button type="button" className="results-action-button results-export-hide" onClick={onExport} aria-label="Export PDF">
            <Download size={14} />
          </button>
        </div>
        <div className="results-highlight-title">{biggestIssue?.title || 'No critical issue detected'}</div>
        <p className="results-highlight-body">{biggestIssue?.body || 'Performance did not surface a major negative outlier.'}</p>
      </div>
    </div>
  )
}

function ComparisonSection({ report }) {
  const { deltas, performance_score, summary, actual_rates } = report
  return (
    <Card>
      <div className="performance-hero">
        <div>
          <SectionTitle icon={Radar}>Performance Comparison</SectionTitle>
          <div className="performance-score-label">Performance Score</div>
          <div className="performance-score-value">
            {performance_score > 0 ? '+' : ''}{Math.round(performance_score)}
          </div>
        </div>
        <div className="performance-score-bar-wrap">
          <ScoreBar score={performance_score} />
        </div>
      </div>

      <div className="metric-card-grid">
        <MetricCard
          label="CTR"
          value={actual_rates?.ctr != null ? `${(actual_rates.ctr * 100).toFixed(2)}%` : '—'}
          delta={deltas.ctr_diff?.pct_diff}
          positive={deltas.ctr_diff?.favorable}
        />
        <MetricCard
          label="CVR"
          value={actual_rates?.cvr != null ? `${(actual_rates.cvr * 100).toFixed(2)}%` : '—'}
          delta={deltas.cvr_diff?.pct_diff}
          positive={deltas.cvr_diff?.favorable}
        />
        <MetricCard
          label="CPA"
          value={actual_rates?.cpa != null ? `$${actual_rates.cpa.toFixed(2)}` : '—'}
          delta={deltas.cpa_diff?.pct_diff}
          positive={deltas.cpa_diff?.favorable}
        />
        <MetricCard
          label="ROAS"
          value={actual_rates?.roas != null ? `${actual_rates.roas.toFixed(2)}x` : '—'}
          delta={deltas.roas_diff?.pct_diff}
          positive={deltas.roas_diff?.favorable}
        />
      </div>

      {summary?.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summary.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>›</span>
              {s}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function FindingRow({ finding }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>
          {finding.description}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
            color: finding.impact_score >= 0 ? 'var(--green)' : 'var(--red)',
          }}
        >
          {finding.impact_score > 0 ? '+' : ''}{finding.impact_score.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tag>{finding.signal_key}</Tag>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{finding.evidence_count} campaigns</span>
      </div>
      <ImpactBar score={finding.impact_score} />
    </div>
  )
}

function PatternsSection({ pattern_report }) {
  const [open, setOpen] = useState('winning_audiences')
  const [collapsed, setCollapsed] = useState(false)

  const groups = [
    { key: 'winning_audiences', label: 'Winning Audiences' },
    { key: 'high_performing_creatives', label: 'High-Performing Creatives' },
    { key: 'budget_inefficiencies', label: 'Budget Inefficiencies' },
    { key: 'platform_trends', label: 'Platform Trends' },
    { key: 'clusters', label: 'Clusters' },
  ].filter(g => pattern_report[g.key]?.length > 0)

  if (!groups.length) {
    return (
      <Card>
        <SectionTitle icon={TrendingUp}>Patterns</SectionTitle>
        <EmptyState message="No patterns detected for this campaign yet." />
      </Card>
    )
  }

  return (
    <Card>
      <div className="results-section-header">
        <SectionTitle icon={TrendingUp}>Patterns</SectionTitle>
        <button type="button" className="results-collapse-button" onClick={() => setCollapsed(value => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {!collapsed && (
        <>
          {pattern_report.auto_tags?.length > 0 && (
            <div className="pattern-pill-row">
              {pattern_report.auto_tags.map(t => <span key={t} className="pattern-pill">{t}</span>)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {groups.map(g => (
              <button
                key={g.key}
                onClick={() => setOpen(g.key)}
                className={open === g.key ? 'results-premium-tab workspace-right-tab workspace-right-tab-active' : 'results-premium-tab workspace-right-tab'}
              >
                {g.label}
                <span style={{ marginLeft: 5, opacity: 0.6 }}>({pattern_report[g.key].length})</span>
              </button>
            ))}
          </div>

          <div>
            {(pattern_report[open] || []).map(f => (
              <FindingRow key={f.finding_id} finding={f} />
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

function InsightsSection({ insights }) {
  return (
    <Card>
      <SectionTitle icon={Lightbulb}>Insights</SectionTitle>
      <InsightCard insights={insights} />
    </Card>
  )
}

function RecommendationsSection({ insights }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!insights.recommendations?.length) return null
  return (
    <Card>
      <div className="results-section-header">
        <SectionTitle icon={Sparkles}>Recommendations</SectionTitle>
        <button type="button" className="results-collapse-button" onClick={() => setCollapsed(value => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!collapsed && (
        <RecommendationList
          items={insights.recommendations}
          whyReasons={[...(insights.anomalies || []), ...(insights.key_learnings || []), insights.narrative_summary].filter(Boolean)}
        />
      )}
    </Card>
  )
}

function SimilarSection({ similar_campaigns }) {
  const [collapsed, setCollapsed] = useState(true)

  if (!similar_campaigns?.length) return null
  return (
    <Card>
      <div className="results-section-header">
        <SectionTitle icon={TrendingDown}>Similar Campaigns</SectionTitle>
        <button type="button" className="results-collapse-button" onClick={() => setCollapsed(value => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {similar_campaigns.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: 36 }}>
                {Math.round(c.score * 100)}%
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {c.campaign_id || c.document_id}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {c.summary}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function deriveBiggestIssue(report) {
  const candidateMap = [
    { key: 'ctr_diff', title: 'CTR is trailing plan' },
    { key: 'cvr_diff', title: 'CVR is below target' },
    { key: 'cpa_diff', title: 'CPA is too high' },
    { key: 'roas_diff', title: 'ROAS is under pressure' },
  ]

  const candidates = candidateMap
    .map(item => ({ ...item, data: report?.deltas?.[item.key] }))
    .filter(item => item.data?.pct_diff != null && item.data?.favorable === false)
    .sort((a, b) => Math.abs(b.data.pct_diff) - Math.abs(a.data.pct_diff))

  if (!candidates.length) return null

  const top = candidates[0]
  return {
    title: top.title,
    body: `Current analysis shows ${Math.abs(top.data.pct_diff).toFixed(1)}% variance versus target, making this the main drag on campaign efficiency.`,
  }
}

export default function ResultsPanel({ result, forcedTab, showOverview = true }) {
  const [activeTab, setActiveTab] = useState(forcedTab || 'performance')

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab)
  }, [forcedTab])

  if (!result) return null

  const { comparison_report, pattern_report, insights, similar_campaigns } = result
  const topInsight = useMemo(() => ({
    title: insights?.key_learnings?.[0] || 'Narrative summary',
    body: insights?.narrative_summary || 'No insight summary available yet.',
  }), [insights])
  const biggestIssue = useMemo(() => deriveBiggestIssue(comparison_report), [comparison_report])

  const tabs = [
    { id: 'performance', label: 'Performance' },
    { id: 'insights', label: 'Insights' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'recommendations', label: 'Recommendations' },
  ]

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-export-results="true">
      {showOverview && (
        <ResultsHero
          topInsight={topInsight}
          biggestIssue={biggestIssue}
          onCopy={() => copyText(topInsight.body)}
          onExport={() => exportResultsPDF()}
        />
      )}

      <div className="results-premium-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'results-premium-tab workspace-right-tab workspace-right-tab-active' : 'results-premium-tab workspace-right-tab'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && <ComparisonSection report={comparison_report} />}
      {activeTab === 'insights' && <InsightsSection insights={insights} />}
      {activeTab === 'patterns' && <PatternsSection pattern_report={pattern_report} />}
      {activeTab === 'recommendations' && <RecommendationsSection insights={insights} />}
      <SimilarSection similar_campaigns={similar_campaigns} />
    </div>
  )
}

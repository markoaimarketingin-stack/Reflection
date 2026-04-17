import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import AgentWorkspaceLayout from '../components/AgentWorkspaceLayout'
import CampaignForm from '../components/CampaignForm'
import ResultsPanel from '../components/ResultsPanel'
import { ErrorBox } from '../components/ui'
import AgentChatPanel from '../components/AgentChatPanel'
import StepLoader from '../components/StepLoader'
import { clearViewState, loadViewState, persistViewState } from '../lib/viewState'
import { analyzeCampaign } from '../api/api'

function Placeholder() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <span className="placeholder-icon-box">
          <Sparkles size={20} color="#111111" />
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Ready
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
        Add campaign inputs, run analysis, and review results here.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {['Comparison', 'Patterns', 'Insights', 'Recommendations'].map((step, i) => (
          <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}>{step}</span>
            {i < 3 && <span style={{ color: 'var(--border-light)', fontSize: 12 }}>·</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

const ANALYZE_STATE_KEY = 'marko-analyze-page-state'
const initialViewState = loadViewState(ANALYZE_STATE_KEY, {}) || {}

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [formCollapsed, setFormCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(initialViewState.rightCollapsed ?? false)
  const [rightTab, setRightTab] = useState(initialViewState.rightTab ?? 'chat')
  const [activeAgent, setActiveAgent] = useState(initialViewState.activeAgent ?? 'supervisor')
  const [formDraft, setFormDraft] = useState(null)

  async function handleSubmit(payload) {
    setLoading(true)
    setError(null)
    setResult(null)
    setFormCollapsed(true)
    setFormDraft(payload)
    try {
      const data = await analyzeCampaign(payload)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Unexpected error. Please try again.')
      setFormCollapsed(false)
    } finally {
      setLoading(false)
    }
  }

  const suggestions = useMemo(() => {
    if (!result?.insights?.recommendations?.length) return []
    return result.insights.recommendations.slice(0, 3)
  }, [result])

  const agentMeta = {
    supervisor: {
      section: 'Orchestrator',
      title: 'Supervisor Agent',
      description: 'Coordinates the workflow and keeps the strongest results in focus.',
      tab: null,
    },
    analysis: {
      section: 'Specialist Agent',
      title: 'Analysis Agent',
      description: 'Tracks score movement and core efficiency metrics.',
      tab: 'performance',
    },
    pattern: {
      section: 'Specialist Agent',
      title: 'Pattern Agent',
      description: 'Surfaces recurring signals, wins, and inefficiencies.',
      tab: 'patterns',
    },
    insight: {
      section: 'Specialist Agent',
      title: 'Insight Agent',
      description: 'Turns output into narrative insight and takeaways.',
      tab: 'insights',
    },
    memory: {
      section: 'Specialist Agent',
      title: 'Memory Agent',
      description: 'Recalls similar campaigns and retained actions.',
      tab: null,
    },
  }

  const currentAgent = agentMeta[activeAgent] || agentMeta.supervisor

  useEffect(() => {
    clearViewState(ANALYZE_STATE_KEY)
    persistViewState(ANALYZE_STATE_KEY, {
      rightCollapsed,
      rightTab,
      activeAgent,
      formDraft,
    })
  }, [rightCollapsed, rightTab, activeAgent, formDraft])

  const chatContext = useMemo(() => ({
    agentTitle: currentAgent.title,
    narrative: result?.insights?.narrative_summary || '',
    keyLearnings: result?.insights?.key_learnings || [],
    recommendations: result?.insights?.recommendations || [],
    patterns: result?.pattern_report?.auto_tags || [],
    comparison: result?.comparison_report?.summary || [],
    memory: (result?.similar_campaigns || []).map(item => item.campaign_id || item.document_id),
  }), [currentAgent.title, result])

  function renderAgentResultView() {
    if (loading) return <StepLoader />
    if (!result && !error) return <Placeholder />
    if (!result) return null

    if (activeAgent === 'memory') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="workspace-main-card">
            <div className="workspace-section-label">Campaign Memory</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '6px 0 12px' }}>
              Similar Campaign Recall
            </div>
            {result.similar_campaigns?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.similar_campaigns.map((item, index) => (
                  <div key={index} className="workspace-suggestion-item">
                    <span className="workspace-suggestion-index">{Math.round(item.score * 100)}</span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.campaign_id || item.document_id}</strong>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{item.summary}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="workspace-side-muted">No similar campaign memory available yet.</div>
            )}
          </div>

          <div className="workspace-main-card">
            <div className="workspace-section-label">Retained Actions</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '6px 0 12px' }}>
              Stored Recommendations
            </div>
            {result.insights?.recommendations?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.insights.recommendations.map((item, index) => (
                  <div key={index} className="workspace-suggestion-item">
                    <span className="workspace-suggestion-index">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="workspace-side-muted">No retained recommendations yet.</div>
            )}
          </div>
        </div>
      )
    }

    return (
      <ResultsPanel
        result={result}
        forcedTab={currentAgent.tab || undefined}
        showOverview={activeAgent === 'supervisor'}
      />
    )
  }

  return (
    <AgentWorkspaceLayout
      activeAgent={activeAgent}
      rightCollapsed={rightCollapsed}
      onToggleRight={() => setRightCollapsed(value => !value)}
      onAgentSelect={setActiveAgent}
      leftContent={
        <div className="workspace-side-card workspace-sidebar-footer-card" style={{ marginTop: 24 }}>
          <div className="workspace-section-label">{currentAgent.title}</div>
          <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {currentAgent.description}
          </p>
        </div>
      }
      mainContent={
        <div className="workspace-main-inner">
          <div className="workspace-main-header workspace-main-hero-card">
            <div>
              <div className="workspace-section-label">{currentAgent.section}</div>
              <h1 style={{ margin: '4px 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentAgent.title}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 560 }}>
                {currentAgent.description}
              </p>
            </div>
            {result && (
              <button type="button" className="btn-ghost" onClick={() => setFormCollapsed(value => !value)}>
                {formCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                {formCollapsed ? 'Expand Setup' : 'Collapse Setup'}
              </button>
            )}
          </div>

          {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

          {result && !loading && (
            <div className="workspace-results-first">
              <div className="workspace-section-label">Priority Results</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {activeAgent === 'supervisor'
                  ? 'Results stay in focus. Setup stays available below when needed.'
                  : `${currentAgent.title} is focused on its assigned view.`}
              </div>
            </div>
          )}

          {!loading && (!formCollapsed || !result) && (
            <section className="workspace-main-card workspace-main-form-card">
              <div style={{ marginBottom: 16 }}>
                <div className="workspace-section-label">Campaign Analysis</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Setup
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 520 }}>
                  Enter campaign inputs and benchmark metrics. Analysis routes automatically after submission.
                </p>
              </div>
              <CampaignForm
                onSubmit={handleSubmit}
                loading={loading}
                onDraftChange={setFormDraft}
              />
            </section>
          )}

          <section className="workspace-results-area">{renderAgentResultView()}</section>
        </div>
      }
      rightTab={rightTab}
      onRightTabChange={setRightTab}
      chatContent={<AgentChatPanel context={chatContext} />}
      suggestionContent={
        result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(activeAgent === 'analysis'
              ? (result.comparison_report?.summary || []).slice(0, 3)
              : activeAgent === 'pattern'
                ? result.pattern_report?.auto_tags || []
                : activeAgent === 'memory'
                  ? (result.similar_campaigns || []).slice(0, 3).map(item => item.campaign_id || item.document_id)
                  : suggestions
            ).length > 0 ? (
              (activeAgent === 'analysis'
                ? (result.comparison_report?.summary || []).slice(0, 3)
                : activeAgent === 'pattern'
                  ? result.pattern_report?.auto_tags || []
                  : activeAgent === 'memory'
                    ? (result.similar_campaigns || []).slice(0, 3).map(item => item.campaign_id || item.document_id)
                    : suggestions
              ).map((item, index) => (
                <div key={index} className="workspace-suggestion-item">
                  <span className="workspace-suggestion-index">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="workspace-side-muted">No active suggestions</div>
            )}
          </div>
        ) : (
          <div className="workspace-side-muted">No active suggestions</div>
        )
      }
      systemStatus={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="workspace-status-row">
            <span>Supervisor</span>
            <span>{loading ? 'Running' : result ? 'Ready' : 'Idle'}</span>
          </div>
          <div className="workspace-status-row">
            <span>Analysis Agent</span>
            <span>{loading ? 'Processing' : result ? 'Completed' : 'Waiting'}</span>
          </div>
          <div className="workspace-status-row">
            <span>Insight Agent</span>
            <span>{result ? 'Synced' : 'Standby'}</span>
          </div>
        </div>
      }
    />
  )
}

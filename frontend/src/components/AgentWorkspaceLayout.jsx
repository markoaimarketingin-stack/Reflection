import {
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
  History,
  Lightbulb,
  LineChart,
  MessagesSquare,
  Orbit,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ORCHESTRATOR = [{ id: 'supervisor', label: 'Supervisor Agent', icon: Orbit }]
const SPECIALISTS = [
  { id: 'analysis', label: 'Analysis Agent', icon: LineChart },
  { id: 'pattern', label: 'Pattern Agent', icon: Activity },
  { id: 'insight', label: 'Insight Agent', icon: Lightbulb },
  { id: 'memory', label: 'Memory Agent', icon: Brain },
]
const HISTORY = [{ id: 'history', label: 'Execution History', icon: History }]

function NavSection({ title, items, activeId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="workspace-section-label">{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => {
          const Icon = item.icon
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={active ? 'workspace-agent-item workspace-agent-item-active' : 'workspace-agent-item'}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AgentWorkspaceLayout({
  activeAgent = 'supervisor',
  leftContent,
  mainContent,
  chatContent,
  suggestionContent,
  systemStatus,
  rightCollapsed,
  rightTab = 'chat',
  onToggleRight,
  onRightTabChange,
  onAgentSelect,
}) {
  const navigate = useNavigate()

  return (
    <div className={rightCollapsed ? 'workspace-shell workspace-shell-right-collapsed' : 'workspace-shell'}>
      <aside data-intro-reveal="analyze-panel" className="workspace-sidebar">
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.05 }}>
            Multi-Agent Workspace
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <NavSection title="Orchestrator" items={ORCHESTRATOR} activeId={activeAgent} onSelect={onAgentSelect} />
          <NavSection title="Specialist Agents" items={SPECIALISTS} activeId={activeAgent} onSelect={onAgentSelect} />
          <NavSection title="History" items={HISTORY} activeId={activeAgent} onSelect={() => navigate('/history')} />
        </div>

        {leftContent && <div style={{ marginTop: 'auto' }}>{leftContent}</div>}
      </aside>

      <main data-intro-reveal="results-panel" className="workspace-main">
        {mainContent}
      </main>

      <aside className={rightCollapsed ? 'workspace-right workspace-right-collapsed' : 'workspace-right'}>
        {rightCollapsed ? (
          <div className="workspace-right-collapsed-shell">
            <button
              type="button"
              onClick={onToggleRight}
              className="workspace-right-toggle workspace-right-toggle-inline"
              aria-label="Open AI panel"
            >
              <PanelRightOpen size={16} />
            </button>
          </div>
        ) : (
          <div data-intro-reveal className="workspace-right-inner">
            <section className="workspace-side-card workspace-right-tabs-card">
              <div className="workspace-side-card-header">
                <div>
                  <div className="workspace-section-label">Assistant Panel</div>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    {rightTab === 'chat' ? 'Conversation' : 'Suggestions'}
                  </div>
                </div>
                <div className="workspace-side-card-actions">
                  <span className="workspace-icon-box">
                    {rightTab === 'chat' ? <MessagesSquare size={16} color="#ffffff" /> : <Sparkles size={16} color="#ffffff" />}
                  </span>
                  <button
                    type="button"
                    onClick={onToggleRight}
                    className="workspace-right-toggle workspace-right-toggle-inline"
                    aria-label="Collapse AI panel"
                  >
                    <PanelRightClose size={16} />
                  </button>
                </div>
              </div>

              <div className="workspace-right-tabs">
                <button
                  type="button"
                  className={rightTab === 'chat' ? 'workspace-right-tab workspace-right-tab-active' : 'workspace-right-tab'}
                  onClick={() => onRightTabChange?.('chat')}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className={rightTab === 'suggestions' ? 'workspace-right-tab workspace-right-tab-active' : 'workspace-right-tab'}
                  onClick={() => onRightTabChange?.('suggestions')}
                >
                  Suggestions
                </button>
              </div>

              <div className="workspace-right-tab-content">
                {rightTab === 'chat' ? chatContent : suggestionContent}
              </div>
            </section>

            <section className="workspace-side-card">
              <div className="workspace-side-card-header">
                <div>
                  <div className="workspace-section-label">System Status</div>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Live State</div>
                </div>
              </div>
              {systemStatus}
            </section>
          </div>
        )}
      </aside>
    </div>
  )
}

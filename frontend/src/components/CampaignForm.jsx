import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Sparkles, Wand2 } from 'lucide-react'

const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Snapchat', 'Twitter/X', 'YouTube']
const OBJECTIVES = ['Lead Generation', 'Conversions', 'Brand Awareness', 'Traffic', 'App Installs', 'Video Views', 'Engagement']

const SAMPLE_DATA = {
  campaign_id: 'cmp_meta_genz_q2',
  platform: 'Meta',
  objective: 'Lead Generation',
  expected_metrics: { impressions: 100000, clicks: 2500, conversions: 150, spend: 2000, revenue: 7500 },
  actual_metrics: { impressions: 134000, clicks: 4200, conversions: 210, spend: 2150, revenue: 10500 },
  audiences: [{ name: 'Gen Z Students', attributes: { age_range: '18-24', segment: 'students', city_tier: 'Tier-1' } }],
  creatives: [{ id: 'crt_001', type: 'video', headline: 'Learn faster, earn sooner', primary_text: 'Short-form video showing student success story.' }],
}

const inputStyle = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 10px', color: 'var(--text-primary)',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' }
const emptyMetrics = () => ({ impressions: '', clicks: '', conversions: '', spend: '', revenue: '' })

function FormSection({ eyebrow, title, description, children }) {
  return (
    <section className="analyze-section-card">
      <div style={{ marginBottom: 14 }}>
        <div className="analyze-section-eyebrow">{eyebrow}</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        {description && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function StepButton({ index, title, detail, active, complete, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        active
          ? 'campaign-step-button campaign-step-button-active'
          : complete
            ? 'campaign-step-button campaign-step-button-complete'
            : 'campaign-step-button'
      }
    >
      <span className="campaign-step-index">{complete ? <Check size={13} /> : index}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 11, color: active ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{detail}</span>
      </span>
    </button>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="label">{label}</label>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 5px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function MetricsGrid({ value, onChange }) {
  const fields = [
    { key: 'impressions', label: 'Impressions', placeholder: '100000' },
    { key: 'clicks', label: 'Clicks', placeholder: '2500' },
    { key: 'conversions', label: 'Conversions', placeholder: '150' },
    { key: 'spend', label: 'Spend ($)', placeholder: '500' },
    { key: 'revenue', label: 'Revenue ($) - optional', placeholder: '1200', optional: true },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {fields.map(f => (
          <div key={f.key} style={f.key === 'revenue' ? { gridColumn: '1 / -1' } : {}}>
            <label className="label">{f.label}</label>
            <input
              type="number" min="0" step={f.key === 'spend' || f.key === 'revenue' ? '0.01' : '1'}
              placeholder={f.placeholder}
              value={value[f.key] ?? ''}
              onChange={e => onChange({ ...value, [f.key]: e.target.value === '' ? '' : Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CampaignForm({ onSubmit, loading, onDraftChange = null }) {
  const [campaignId, setCampaignId] = useState('')
  const [platform, setPlatform] = useState('')
  const [objective, setObjective] = useState('')
  const [expected, setExpected] = useState(emptyMetrics())
  const [actual, setActual] = useState(emptyMetrics())
  const [activeStep, setActiveStep] = useState('setup')

  const setupComplete = Boolean(campaignId.trim() && platform && objective)
  const expectedComplete = useMemo(
    () => ['impressions', 'clicks', 'conversions', 'spend'].every(key => expected[key] !== '' && expected[key] != null),
    [expected],
  )
  const actualComplete = useMemo(
    () => ['impressions', 'clicks', 'conversions', 'spend'].every(key => actual[key] !== '' && actual[key] != null),
    [actual],
  )

  useEffect(() => {
    if (!onDraftChange) return
    onDraftChange({
      campaign_id: campaignId,
      platform,
      objective,
      expected_metrics: expected,
      actual_metrics: actual,
      activeStep,
      audiences: SAMPLE_DATA.audiences,
      creatives: SAMPLE_DATA.creatives,
    })
  }, [campaignId, platform, objective, expected, actual, activeStep, onDraftChange])

  function fillSample() {
    setCampaignId(SAMPLE_DATA.campaign_id)
    setPlatform(SAMPLE_DATA.platform)
    setObjective(SAMPLE_DATA.objective)
    setExpected(SAMPLE_DATA.expected_metrics)
    setActual(SAMPLE_DATA.actual_metrics)
    setActiveStep('actual')
  }

  useEffect(() => {
    if (activeStep === 'setup' && setupComplete) setActiveStep('expected')
    if (activeStep === 'expected' && expectedComplete) setActiveStep('actual')
  }, [activeStep, expectedComplete, setupComplete])

  function handleSubmit() {
    const cleanMetrics = m => ({
      impressions: Number(m.impressions) || 0,
      clicks: Number(m.clicks) || 0,
      conversions: Number(m.conversions) || 0,
      spend: Number(m.spend) || 0,
      ...(m.revenue !== '' && m.revenue != null ? { revenue: Number(m.revenue) } : {}),
    })

    onSubmit({
      campaign_id: campaignId.trim(),
      platform,
      objective,
      expected_metrics: cleanMetrics(expected),
      actual_metrics: cleanMetrics(actual),
      audiences: SAMPLE_DATA.audiences,
      creatives: SAMPLE_DATA.creatives,
      timestamp: new Date().toISOString(),
    })
  }

  const isValid = setupComplete && expectedComplete && actualComplete

  return (
    <div className="campaign-form-shell" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        className="btn-ghost campaign-fill-button"
        onClick={fillSample}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <Wand2 size={14} /> Fill Sample Data
      </button>

      <div className="campaign-step-grid">
        <StepButton
          index="1"
          title="Campaign Setup"
          detail={setupComplete ? 'Ready' : 'Add identity'}
          active={activeStep === 'setup'}
          complete={setupComplete}
          onClick={() => setActiveStep('setup')}
        />
        <StepButton
          index="2"
          title="Expected Metrics"
          detail={expectedComplete ? 'Ready' : 'Set targets'}
          active={activeStep === 'expected'}
          complete={expectedComplete}
          disabled={!setupComplete}
          onClick={() => setActiveStep('expected')}
        />
        <StepButton
          index="3"
          title="Actual Metrics"
          detail={actualComplete ? 'Ready' : 'Add results'}
          active={activeStep === 'actual'}
          complete={actualComplete}
          disabled={!setupComplete || !expectedComplete}
          onClick={() => setActiveStep('actual')}
        />
      </div>

      {activeStep === 'setup' && (
        <FormSection
          eyebrow="Campaign Setup"
          title="Campaign Setup"
          description="Define the campaign identity before comparing planned and actual performance."
        >
          <Field label="Campaign ID *">
            <input
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              placeholder="e.g. cmp_meta_q2_launch"
              style={inputStyle}
            />
          </Field>

          <Field label="Platform *">
            <div style={{ position: 'relative' }}>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={selectStyle}>
                <option value="">Select platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', display: 'inline-flex' }}>
                <ChevronDown size={14} />
              </span>
            </div>
          </Field>

          <Field label="Objective *">
            <div style={{ position: 'relative' }}>
              <select value={objective} onChange={e => setObjective(e.target.value)} style={selectStyle}>
                <option value="">Select objective</option>
                {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', display: 'inline-flex' }}>
                <ChevronDown size={14} />
              </span>
            </div>
          </Field>
        </FormSection>
      )}

      {activeStep === 'expected' && (
        <FormSection eyebrow="Expected Metrics" title="Targets" description="Planned values before launch.">
          <MetricsGrid value={expected} onChange={setExpected} />
        </FormSection>
      )}

      {activeStep === 'actual' && (
        <FormSection eyebrow="Actual Metrics" title="Results" description="Observed values after the campaign ran.">
          <MetricsGrid value={actual} onChange={setActual} />
        </FormSection>
      )}

      <button
        className="btn-primary campaign-submit-button"
        onClick={handleSubmit}
        disabled={!isValid || loading}
        style={{ marginTop: 2, boxShadow: '0 0 0 1px var(--accent-border), 0 12px 24px var(--accent-glow)' }}
      >
        <Sparkles size={14} /> Analyze Campaign
      </button>
    </div>
  )
}

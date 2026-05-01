import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Save, Settings as SettingsIcon, Mail, Send,
  Eye, EyeOff, CheckCircle, Loader2, Wifi,
} from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import PageHeader from '../components/PageHeader'

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [form,     setForm]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => { setSettings(data); setForm({ ...data }) })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/admin/settings', form)
      setSettings(data); setForm({ ...data })
      toast.success('Settings saved')
    } catch { toast.error('Failed to save settings') }
    finally  { setSaving(false) }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const changed = form && JSON.stringify(form) !== JSON.stringify(settings)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Platform-wide configuration"
        action={
          <button className="btn-primary flex items-center gap-2" onClick={save}
            disabled={saving || !changed}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
          </button>
        }
      />

      <div className="max-w-2xl space-y-4">

        {/* Fees & Limits */}
        <Section title="Fees & Transfer Limits" icon={SettingsIcon}>
          <Row label="Transfer fee rate (%)" hint="Applied to all transfers">
            <input type="number" step="0.001" min="0" max="0.1" className="input-field w-40"
              value={(form.transfer_fee_rate * 100).toFixed(2)}
              onChange={e => set('transfer_fee_rate', Number(e.target.value) / 100)} />
          </Row>
          <Row label="Default daily limit" hint="Per wallet, in wallet currency">
            <input type="number" className="input-field w-40"
              value={form.daily_limit_default}
              onChange={e => set('daily_limit_default', Number(e.target.value))} />
          </Row>
          <Row label="Default monthly limit">
            <input type="number" className="input-field w-40"
              value={form.monthly_limit_default}
              onChange={e => set('monthly_limit_default', Number(e.target.value))} />
          </Row>
          <Row label="Minimum transfer amount">
            <input type="number" step="0.01" className="input-field w-40"
              value={form.min_transfer_amount}
              onChange={e => set('min_transfer_amount', Number(e.target.value))} />
          </Row>
          <Row label="Maximum transfer amount">
            <input type="number" className="input-field w-40"
              value={form.max_transfer_amount}
              onChange={e => set('max_transfer_amount', Number(e.target.value))} />
          </Row>
        </Section>

        {/* App Config */}
        <Section title="Application" icon={SettingsIcon}>
          <Row label="App name">
            <input className="input-field w-56" value={form.app_name}
              onChange={e => set('app_name', e.target.value)} />
          </Row>
          <Row label="Support email">
            <input type="email" className="input-field w-56" value={form.support_email}
              onChange={e => set('support_email', e.target.value)} />
          </Row>
        </Section>

        {/* Toggles */}
        <Section title="Feature Flags" icon={SettingsIcon}>
          <Toggle label="Maintenance mode"
            hint="When enabled, all API endpoints return 503 (except admin)"
            value={form.maintenance_mode} onChange={v => set('maintenance_mode', v)} danger />
          <Toggle label="KYC required for transfers"
            hint="Block transfers from users who haven't completed KYC"
            value={form.kyc_required} onChange={v => set('kyc_required', v)} />
        </Section>

        {changed && (
          <div className="card p-4 border-amber-200 bg-amber-50">
            <p className="text-xs font-semibold text-amber-700 mb-1">Unsaved changes</p>
            <p className="text-xs text-amber-600">Click "Save Changes" to apply.</p>
          </div>
        )}

        {/* SMTP — separate save state */}
        <SmtpSection />
      </div>
    </div>
  )
}

// ── SMTP Section ───────────────────────────────────────────────────────────────

const SMTP_EMPTY = {
  host: '', port: 587, username: '', password: '',
  from_email: '', from_name: 'Kalipeh',
  use_tls: true, use_ssl: false, enabled: false,
}

function SmtpSection() {
  const [form,      setForm]      = useState(SMTP_EMPTY)
  const [original,  setOriginal]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [showPwd,   setShowPwd]   = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing,   setTesting]   = useState(false)

  useEffect(() => {
    api.get('/admin/smtp-settings')
      .then(({ data }) => {
        const clean = { ...SMTP_EMPTY, ...data, password: '' }
        setForm(clean)
        setOriginal(clean)
      })
      .catch(() => toast.error('Failed to load SMTP settings'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/admin/smtp-settings', form)
      const clean = { ...SMTP_EMPTY, ...data, password: '' }
      setForm(clean)
      setOriginal(clean)
      toast.success('SMTP settings saved')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save SMTP settings')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!testEmail) { toast.error('Enter a recipient email for the test'); return }
    setTesting(true)
    try {
      await api.post('/admin/smtp-settings/test', { to: testEmail })
      toast.success(`Test email sent to ${testEmail}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Test email failed')
    } finally {
      setTesting(false)
    }
  }

  const changed = original && JSON.stringify(form) !== JSON.stringify(original)

  if (loading) return (
    <div className="card p-5 flex items-center gap-3 text-gray-400 text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading SMTP settings…
    </div>
  )

  return (
    <div className="card p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-indigo-500" />
          <p className="font-semibold text-gray-800 text-sm">Email / SMTP</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Enabled toggle */}
          <span className="text-xs text-gray-500">
            {form.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button type="button" onClick={() => set('enabled', !form.enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Connection</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">SMTP Host</label>
            <input className="input-field" placeholder="smtp.gmail.com"
              value={form.host} onChange={e => set('host', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Port</label>
            <input className="input-field" type="number" placeholder="587"
              value={form.port} onChange={e => set('port', Number(e.target.value))} />
          </div>
        </div>

        {/* Encryption */}
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="radio" name="encryption" checked={!form.use_tls && !form.use_ssl}
              onChange={() => set('use_tls', false) || set('use_ssl', false)}
              className="accent-indigo-600"
              onClick={() => { set('use_tls', false); set('use_ssl', false) }} />
            <span className="text-sm text-gray-700">None</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="radio" name="encryption" checked={form.use_tls && !form.use_ssl}
              onChange={() => { set('use_tls', true); set('use_ssl', false) }}
              className="accent-indigo-600" />
            <span className="text-sm text-gray-700">STARTTLS <span className="text-xs text-gray-400">(port 587)</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="radio" name="encryption" checked={form.use_ssl}
              onChange={() => { set('use_ssl', true); set('use_tls', false) }}
              className="accent-indigo-600" />
            <span className="text-sm text-gray-700">SSL/TLS <span className="text-xs text-gray-400">(port 465)</span></span>
          </label>
        </div>
      </div>

      {/* Authentication */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Authentication</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
            <input className="input-field" placeholder="you@gmail.com"
              value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Password / App password</label>
            <div className="relative">
              <input className="input-field pr-10"
                type={showPwd ? 'text' : 'password'}
                placeholder="Leave blank to keep existing"
                value={form.password}
                onChange={e => set('password', e.target.value)} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sender identity */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sender Identity</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From email</label>
            <input className="input-field" type="email" placeholder="no-reply@kalipeh.com"
              value={form.from_email} onChange={e => set('from_email', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From name</label>
            <input className="input-field" placeholder="Kalipeh"
              value={form.from_name} onChange={e => set('from_name', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quick-fill presets */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {SMTP_PRESETS.map(p => (
            <button key={p.label} type="button"
              onClick={() => setForm(f => ({ ...f, host: p.host, port: p.port, use_tls: p.tls, use_ssl: p.ssl }))}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
        <button onClick={save} disabled={saving || !changed}
          className="btn-primary flex items-center gap-2 flex-shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save SMTP'}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input className="input-field flex-1" type="email"
            placeholder="Send test to…"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)} />
          <button onClick={sendTest} disabled={testing || !form.host || !form.from_email}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-sm font-medium transition-colors disabled:opacity-40 flex-shrink-0">
            {testing
              ? <Loader2 size={14} className="animate-spin" />
              : <Send size={14} />}
            {testing ? 'Sending…' : 'Test'}
          </button>
        </div>
      </div>

      {/* Connection info */}
      {form.host && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <Wifi size={11} />
          <span>
            {form.use_ssl ? 'SSL/TLS' : form.use_tls ? 'STARTTLS' : 'Plain'} →{' '}
            {form.host}:{form.port}
            {form.username ? ` · auth: ${form.username}` : ' · no auth'}
          </span>
          {form.enabled && (
            <span className="ml-auto flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle size={10} /> Active
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const SMTP_PRESETS = [
  { label: 'Gmail',     host: 'smtp.gmail.com',      port: 587, tls: true,  ssl: false },
  { label: 'Outlook',   host: 'smtp.office365.com',  port: 587, tls: true,  ssl: false },
  { label: 'SendGrid',  host: 'smtp.sendgrid.net',   port: 587, tls: true,  ssl: false },
  { label: 'Mailgun',   host: 'smtp.mailgun.org',    port: 587, tls: true,  ssl: false },
  { label: 'Amazon SES',host: 'email-smtp.us-east-1.amazonaws.com', port: 587, tls: true, ssl: false },
  { label: 'SSL/465',   host: '',                    port: 465, tls: false, ssl: true  },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <Icon size={16} className="text-indigo-500" />
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, hint, value, onChange, danger }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? (danger ? 'bg-red-500' : 'bg-indigo-600') : 'bg-gray-200'
        }`}>
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

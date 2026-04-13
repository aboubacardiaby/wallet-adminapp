import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Save, Settings as SettingsIcon } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import PageHeader from '../components/PageHeader'

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
      setSettings(data)
      setForm({ ...data })
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
            {saving ? <><Spinner size="sm" /> Saving…</> : <><Save size={15} /> Save Changes</>}
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
          <Row label="Default monthly limit" hint="Per wallet, in wallet currency">
            <input type="number" className="input-field w-40"
              value={form.monthly_limit_default}
              onChange={e => set('monthly_limit_default', Number(e.target.value))} />
          </Row>
          <Row label="Minimum transfer amount" hint="In sender currency">
            <input type="number" step="0.01" className="input-field w-40"
              value={form.min_transfer_amount}
              onChange={e => set('min_transfer_amount', Number(e.target.value))} />
          </Row>
          <Row label="Maximum transfer amount" hint="In sender currency">
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
          <Toggle
            label="Maintenance mode"
            hint="When enabled, all API endpoints return 503 (except admin)"
            value={form.maintenance_mode}
            onChange={v => set('maintenance_mode', v)}
            danger
          />
          <Toggle
            label="KYC required for transfers"
            hint="Block transfers from users who haven't completed KYC"
            value={form.kyc_required}
            onChange={v => set('kyc_required', v)}
          />
        </Section>

        {/* Live preview */}
        {changed && (
          <div className="card p-4 border-amber-200 bg-amber-50">
            <p className="text-xs font-semibold text-amber-700 mb-1">Unsaved changes</p>
            <p className="text-xs text-amber-600">Click "Save Changes" to apply.</p>
          </div>
        )}
      </div>
    </div>
  )
}

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
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value
            ? (danger ? 'bg-red-500' : 'bg-indigo-600')
            : 'bg-gray-200'
        }`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

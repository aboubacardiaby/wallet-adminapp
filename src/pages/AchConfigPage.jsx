import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Save, Loader2, Eye, EyeOff, Wifi, CheckCircle, XCircle,
  Building2,
} from 'lucide-react'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

const EMPTY = {
  api_base_url: 'http://localhost:3000/v1',
  api_key: '',
  platform_account_number: '',
  platform_routing_number: '',
  platform_account_type: 'CHECKING',
  platform_account_name: 'Kalipeh Platform',
  enabled: false,
}

export default function AchConfigPage() {
  const [form,     setForm]     = useState(EMPTY)
  const [original, setOriginal] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [testing,  setTesting]  = useState(false)
  const [showKey,  setShowKey]  = useState(false)
  const [connOk,   setConnOk]   = useState(null)   // null | true | false

  useEffect(() => {
    api.get('/admin/ach-config')
      .then(({ data }) => { setForm({ ...EMPTY, ...data, api_key: '' }); setOriginal({ ...EMPTY, ...data, api_key: '' }) })
      .catch(() => toast.error('Failed to load ACH config'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const changed = original && JSON.stringify(form) !== JSON.stringify(original)

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/admin/ach-config', form)
      const clean = { ...EMPTY, ...data, api_key: '' }
      setForm(clean); setOriginal(clean)
      setConnOk(null)
      toast.success('ACH config saved')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true); setConnOk(null)
    try {
      const { data } = await api.post('/admin/ach-config/test')
      setConnOk(true)
      toast.success(`Connected — token expires in ${data.expires_in}s`)
    } catch (err) {
      setConnOk(false)
      toast.error(err.response?.data?.detail || 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader
        title="ACH Configuration"
        subtitle="Configure the ACH payment provider for bank transfers"
        action={
          <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving || !changed}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save</>}
          </button>
        }
      />

      <div className="max-w-2xl space-y-4">

        {/* Enable / disable */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">ACH Payments</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When disabled, all ACH debit and credit endpoints return 503.
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('enabled', !form.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* API connection */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Wifi size={16} className="text-indigo-500" />
            <p className="font-semibold text-gray-800 text-sm">API Connection</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Base URL</label>
            <input
              className="input-field"
              placeholder="http://localhost:3000/v1"
              value={form.api_base_url}
              onChange={e => set('api_base_url', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
            <div className="relative">
              <input
                className="input-field pr-10"
                type={showKey ? 'text' : 'password'}
                placeholder="Leave blank to keep existing"
                value={form.api_key}
                onChange={e => set('api_key', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-sm font-medium transition-colors disabled:opacity-40"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            {connOk === true  && <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Connected</span>}
            {connOk === false && <span className="flex items-center gap-1 text-red-500 text-sm"><XCircle size={14} /> Failed</span>}
          </div>
        </div>

        {/* Platform account */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Building2 size={16} className="text-indigo-500" />
            <p className="font-semibold text-gray-800 text-sm">Platform Bank Account</p>
            <p className="text-xs text-gray-400 ml-1">— the other side of every ACH transfer</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
              <input
                className="input-field"
                placeholder="000123456789"
                value={form.platform_account_number}
                onChange={e => set('platform_account_number', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Routing Number (9 digits)</label>
              <input
                className="input-field"
                placeholder="121000248"
                maxLength={9}
                value={form.platform_routing_number}
                onChange={e => set('platform_routing_number', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Type</label>
              <select
                className="input-field"
                value={form.platform_account_type}
                onChange={e => set('platform_account_type', e.target.value)}
              >
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Name (max 22 chars)</label>
              <input
                className="input-field"
                placeholder="Kalipeh Platform"
                maxLength={22}
                value={form.platform_account_name}
                onChange={e => set('platform_account_name', e.target.value)}
              />
            </div>
          </div>
        </div>

        {changed && (
          <div className="card p-4 border-amber-200 bg-amber-50">
            <p className="text-xs font-semibold text-amber-700 mb-1">Unsaved changes</p>
            <p className="text-xs text-amber-600">Click "Save" to apply.</p>
          </div>
        )}

        {/* Info box */}
        <div className="card p-4 bg-gray-50 border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1">ACH Flow</p>
          <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
            <li><strong>Debit</strong> (top-up) — pulls from user's bank → credits platform account</li>
            <li><strong>Credit</strong> (payout) — debits platform account → sends to user's bank</li>
            <li>Sandbox transitions payments: PENDING → PROCESSING → COMPLETED automatically</li>
          </ul>
        </div>

      </div>
    </div>
  )
}

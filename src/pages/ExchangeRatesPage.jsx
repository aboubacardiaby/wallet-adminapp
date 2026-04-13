import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  RefreshCw, Plus, Pencil, Trash2, AlertTriangle,
  TrendingUp, CheckCircle,
} from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const EMPTY_FORM = {
  from_currency: 'USD', to_currency: 'XOF',
  rate: '', spread_pct: 0, note: '', is_active: true,
}

export default function ExchangeRatesPage() {
  const [pairs,     setPairs]     = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)   // override object

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/exchange-rates')
      setPairs(data.pairs)
      setOverrides(data.overrides)
    } catch { toast.error('Failed to load exchange rates') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const refreshCache = async () => {
    setRefreshing(true)
    try {
      await api.post('/admin/exchange-rates/refresh-cache')
      toast.success('Cache cleared — rates will refresh on next request')
      load()
    } catch { toast.error('Failed to refresh') }
    finally  { setRefreshing(false) }
  }

  const deleteOverride = async (id) => {
    if (!confirm('Remove this rate override?')) return
    try {
      await api.delete(`/admin/exchange-rates/override/${id}`)
      toast.success('Override removed — live rate restored')
      load()
    } catch { toast.error('Failed to delete override') }
  }

  const openEdit = (o) => { setEditing(o); setShowForm(true) }
  const openNew  = ()  => { setEditing(null); setShowForm(true) }

  return (
    <div>
      <PageHeader
        title="Exchange Rates"
        subtitle="Live market rates · manual override per corridor"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={refreshCache} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh Cache
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={openNew}>
              <Plus size={15} /> Set Override
            </button>
          </div>
        }
      />

      {/* Active overrides banner */}
      {overrides.filter(o => o.is_active).length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{overrides.filter(o => o.is_active).length} active override{overrides.filter(o => o.is_active).length > 1 ? 's' : ''}</span>
            {' '}— these replace live market rates for affected corridors.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Live rates table */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Corridor rates</h2>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left table-header">Pair</th>
                    <th className="px-4 py-2.5 text-right table-header">Live rate</th>
                    <th className="px-4 py-2.5 text-right table-header">Effective</th>
                    <th className="px-4 py-2.5 text-center table-header">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pairs.map(p => (
                    <PairRow key={`${p.from_currency}-${p.to_currency}`} pair={p}
                      onOverride={() => {
                        const existing = overrides.find(o => o.from_currency === p.from_currency && o.to_currency === p.to_currency)
                        if (existing) openEdit(existing)
                        else {
                          setEditing({ ...EMPTY_FORM, from_currency: p.from_currency, to_currency: p.to_currency, rate: p.live_rate })
                          setShowForm(true)
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overrides list */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Manual overrides</h2>
            {overrides.length === 0 ? (
              <div className="card p-12 text-center">
                <TrendingUp size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No overrides — all rates are live market rates</p>
                <button className="btn-primary mt-4 text-sm" onClick={openNew}>Set first override</button>
              </div>
            ) : (
              <div className="space-y-2">
                {overrides.map(o => (
                  <OverrideCard key={o.id} override={o}
                    onEdit={() => openEdit(o)}
                    onDelete={() => deleteOverride(o.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <RateOverrideModal
          initial={editing || EMPTY_FORM}
          isEdit={!!(editing?.id)}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function PairRow({ pair: p, onOverride }) {
  const rateChanged = p.has_override
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2.5 font-mono font-semibold text-gray-900 text-xs">
        {p.from_currency} → {p.to_currency}
      </td>
      <td className="px-4 py-2.5 text-right text-gray-500 font-mono text-xs">
        {p.live_rate?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs">
        <span className={rateChanged ? 'text-amber-600 font-bold' : 'text-gray-700'}>
          {p.effective_rate?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </td>
      <td className="px-4 py-2.5 text-center">
        {rateChanged ? (
          <button onClick={onOverride}
            className="badge bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200">Manual</button>
        ) : (
          <span className="badge bg-green-100 text-green-700">Live</span>
        )}
      </td>
    </tr>
  )
}

function OverrideCard({ override: o, onEdit, onDelete }) {
  const effective = parseFloat(o.rate) * (1 + parseFloat(o.spread_pct || 0))
  return (
    <div className={`card p-4 ${o.is_active ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-gray-900 text-sm">
              {o.from_currency} → {o.to_currency}
            </span>
            {o.is_active
              ? <span className="badge bg-amber-100 text-amber-700">Active</span>
              : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
          </div>
          <p className="text-xl font-bold text-gray-900 font-mono">
            {effective.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Base: {parseFloat(o.rate).toLocaleString(undefined, { maximumFractionDigits: 6 })}
            {parseFloat(o.spread_pct) > 0 && ` + ${(parseFloat(o.spread_pct) * 100).toFixed(2)}% spread`}
          </p>
          {o.note && <p className="text-xs text-gray-500 mt-1 italic">{o.note}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Updated {o.updated_at ? new Date(o.updated_at).toLocaleString() : '—'}
      </p>
    </div>
  )
}

function RateOverrideModal({ initial, isEdit, onClose, onSaved }) {
  const [form, setForm] = useState({ ...initial, rate: initial.rate ? String(initial.rate) : '' })
  const [saving, setSaving] = useState(false)

  const effectiveRate = parseFloat(form.rate || 0) * (1 + parseFloat(form.spread_pct || 0))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        rate: parseFloat(form.rate),
        spread_pct: parseFloat(form.spread_pct || 0),
        from_currency: form.from_currency.toUpperCase(),
        to_currency:   form.to_currency.toUpperCase(),
      }
      if (isEdit && form.id) {
        await api.put(`/admin/exchange-rates/override/${form.id}`, payload)
        toast.success('Override updated')
      } else {
        await api.post('/admin/exchange-rates/override', payload)
        toast.success('Override set')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal title={isEdit ? 'Edit Rate Override' : 'Set Rate Override'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From currency</label>
            <input className="input-field uppercase" maxLength={5} required
              value={form.from_currency}
              onChange={e => set('from_currency', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To currency</label>
            <input className="input-field uppercase" maxLength={5} required
              value={form.to_currency}
              onChange={e => set('to_currency', e.target.value.toUpperCase())} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Override rate <span className="text-gray-400">(1 {form.from_currency} = X {form.to_currency})</span>
          </label>
          <input type="number" step="0.00001" min="0.00001" className="input-field" required
            value={form.rate}
            onChange={e => set('rate', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Spread / markup (%) <span className="text-gray-400">— added on top of override rate</span>
          </label>
          <input type="number" step="0.01" min="0" max="20" className="input-field"
            value={(parseFloat(form.spread_pct || 0) * 100).toFixed(2)}
            onChange={e => set('spread_pct', parseFloat(e.target.value) / 100)} />
        </div>

        {/* Live preview */}
        {form.rate && (
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-xs text-indigo-400 mb-0.5">Effective rate applied to transfers</p>
            <p className="text-lg font-bold text-indigo-700 font-mono">
              1 {form.from_currency} = {effectiveRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {form.to_currency}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
          <input className="input-field" placeholder="e.g. Partner rate locked until end of month"
            value={form.note || ''}
            onChange={e => set('note', e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Active (applies immediately)</label>
          <button type="button" onClick={() => set('is_active', !form.is_active)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Override' : 'Set Override'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

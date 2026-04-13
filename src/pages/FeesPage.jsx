import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const EMPTY_RULE = {
  name: '', from_currency: '', to_currency: '',
  fee_rate: 0.015, fee_flat: 0,
  min_fee: '', max_fee: '',
  min_amount: '', max_amount: '',
  priority: 0, is_active: true, note: '',
}

export default function FeesPage() {
  const [rules,    setRules]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  // Fee preview
  const [preview,   setPreview]  = useState({ from: 'USD', to: 'XOF', amount: '100' })
  const [previewResult, setPreviewResult] = useState(null)
  const [previewing,    setPreviewing]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/fees')
      setRules(data.rules)
    } catch { toast.error('Failed to load fee rules') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const del = async (rule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return
    try {
      await api.delete(`/admin/fees/${rule.id}`)
      toast.success('Rule deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const toggle = async (rule) => {
    try {
      await api.put(`/admin/fees/${rule.id}`, { ...rule, is_active: !rule.is_active })
      load()
    } catch { toast.error('Failed to update') }
  }

  const runPreview = async () => {
    setPreviewing(true)
    try {
      const params = `from_currency=${preview.from}&to_currency=${preview.to}&amount=${preview.amount}`
      const { data } = await api.get(`/admin/fees/preview?${params}`)
      setPreviewResult(data)
    } catch { toast.error('Preview failed') }
    finally  { setPreviewing(false) }
  }

  return (
    <div>
      <PageHeader
        title="Fee Management"
        subtitle="Per-corridor fee rules · highest priority wins"
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> Add Rule
          </button>
        }
      />

      {/* Fee calculator preview */}
      <div className="card p-5 mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Calculator size={15} className="text-indigo-500" /> Fee Preview
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input className="input-field w-24 uppercase" maxLength={5}
              value={preview.from}
              onChange={e => setPreview(p => ({ ...p, from: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input className="input-field w-24 uppercase" maxLength={5}
              value={preview.to}
              onChange={e => setPreview(p => ({ ...p, to: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount</label>
            <input type="number" className="input-field w-32"
              value={preview.amount}
              onChange={e => setPreview(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <button className="btn-secondary flex items-center gap-2" onClick={runPreview} disabled={previewing}>
            {previewing ? <Spinner size="sm" /> : <Calculator size={14} />}
            Calculate
          </button>
          {previewResult && (
            <div className="bg-indigo-50 rounded-xl px-4 py-2.5 flex items-center gap-4 ml-auto">
              <div>
                <p className="text-xs text-indigo-400">Fee</p>
                <p className="font-bold text-indigo-800">
                  {previewResult.fee?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {preview.from}
                </p>
              </div>
              <div>
                <p className="text-xs text-indigo-400">Rate</p>
                <p className="font-bold text-indigo-800">{(previewResult.fee_rate * 100).toFixed(3)}%</p>
              </div>
              {previewResult.fee_flat > 0 && (
                <div>
                  <p className="text-xs text-indigo-400">Flat</p>
                  <p className="font-bold text-indigo-800">{previewResult.fee_flat}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-indigo-400">Rule</p>
                <p className="font-medium text-indigo-700 text-sm">{previewResult.rule_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : rules.length === 0 ? (
        <div className="card p-16 text-center">
          <Calculator size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No fee rules — global default of 1.5% applies to all transfers</p>
          <button className="btn-primary mt-4" onClick={() => { setEditing(null); setShowForm(true) }}>
            Add first rule
          </button>
        </div>
      ) : (
        <>
          {/* Default fallback card */}
          <div className="card p-4 mb-3 border-dashed border-2 border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Default (global fallback)</p>
                <p className="text-xs text-gray-400 mt-0.5">Applies when no rule matches · lowest priority</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-700 text-lg">1.5%</p>
                <p className="text-xs text-gray-400">fee rate</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <FeeRuleCard key={rule.id} rule={rule} index={idx + 1}
                onEdit={() => { setEditing(rule); setShowForm(true) }}
                onDelete={() => del(rule)}
                onToggle={() => toggle(rule)} />
            ))}
          </div>
        </>
      )}

      {showForm && (
        <FeeRuleModal
          initial={editing || EMPTY_RULE}
          isEdit={!!editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function FeeRuleCard({ rule: r, index, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const corridorLabel = [
    r.from_currency || 'ANY',
    '→',
    r.to_currency   || 'ANY',
  ].join(' ')

  return (
    <div className={`card overflow-hidden transition-opacity ${r.is_active ? '' : 'opacity-55'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Priority badge */}
        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-600">{r.priority}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{r.name}</p>
            <span className="badge bg-gray-100 text-gray-500 font-mono text-[11px]">{corridorLabel}</span>
            {r.is_active
              ? <span className="badge bg-green-100 text-green-700">Active</span>
              : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {(parseFloat(r.fee_rate) * 100).toFixed(3)}% fee
            {parseFloat(r.fee_flat) > 0 && ` + ${parseFloat(r.fee_flat)} flat`}
            {r.min_fee  && ` · min ${parseFloat(r.min_fee)}`}
            {r.max_fee  && ` · max ${parseFloat(r.max_fee)}`}
            {r.min_amount && ` · amount ≥ ${parseFloat(r.min_amount)}`}
            {r.max_amount && ` · amount ≤ ${parseFloat(r.max_amount)}`}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            {r.is_active
              ? <ToggleRight size={16} className="text-green-500" />
              : <ToggleLeft  size={16} />}
          </button>
          <button onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <InfoCell label="Fee rate"    value={`${(parseFloat(r.fee_rate) * 100).toFixed(3)}%`} />
            <InfoCell label="Flat fee"    value={parseFloat(r.fee_flat) > 0 ? parseFloat(r.fee_flat) : '—'} />
            <InfoCell label="Priority"    value={r.priority} />
            <InfoCell label="Min fee"     value={r.min_fee  ?? '—'} />
            <InfoCell label="Max fee"     value={r.max_fee  ?? '—'} />
            <InfoCell label="From"        value={r.from_currency || 'Any'} />
            <InfoCell label="To"          value={r.to_currency   || 'Any'} />
            <InfoCell label="Min amount"  value={r.min_amount ?? '—'} />
            <InfoCell label="Max amount"  value={r.max_amount ?? '—'} />
          </div>
          {r.note && <p className="text-xs text-gray-400 mt-2 italic">{r.note}</p>}
        </div>
      )}
    </div>
  )
}

function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold text-gray-700">{value}</p>
    </div>
  )
}

function FeeRuleModal({ initial, isEdit, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...initial,
    fee_rate: initial.fee_rate ? (parseFloat(initial.fee_rate) * 100).toFixed(3) : '1.500',
    fee_flat:   String(initial.fee_flat   || 0),
    min_fee:    String(initial.min_fee    || ''),
    max_fee:    String(initial.max_fee    || ''),
    min_amount: String(initial.min_amount || ''),
    max_amount: String(initial.max_amount || ''),
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        from_currency: form.from_currency?.trim().toUpperCase() || null,
        to_currency:   form.to_currency?.trim().toUpperCase()   || null,
        fee_rate:    parseFloat(form.fee_rate) / 100,
        fee_flat:    parseFloat(form.fee_flat  || 0),
        min_fee:     form.min_fee    ? parseFloat(form.min_fee)    : null,
        max_fee:     form.max_fee    ? parseFloat(form.max_fee)    : null,
        min_amount:  form.min_amount ? parseFloat(form.min_amount) : null,
        max_amount:  form.max_amount ? parseFloat(form.max_amount) : null,
        priority:    parseInt(form.priority || 0),
      }
      if (isEdit) {
        await api.put(`/admin/fees/${form.id}`, payload)
        toast.success('Fee rule updated')
      } else {
        await api.post('/admin/fees', payload)
        toast.success('Fee rule created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save rule')
    } finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Fee Rule' : 'New Fee Rule'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FRow label="Rule name *">
          <input className="input-field" required placeholder="e.g. USD→XOF standard"
            value={form.name} onChange={e => set('name', e.target.value)} />
        </FRow>

        <div className="grid grid-cols-2 gap-3">
          <FRow label="From currency" hint="Leave empty to match any">
            <input className="input-field uppercase" maxLength={5} placeholder="e.g. USD"
              value={form.from_currency || ''}
              onChange={e => set('from_currency', e.target.value.toUpperCase())} />
          </FRow>
          <FRow label="To currency" hint="Leave empty to match any">
            <input className="input-field uppercase" maxLength={5} placeholder="e.g. XOF"
              value={form.to_currency || ''}
              onChange={e => set('to_currency', e.target.value.toUpperCase())} />
          </FRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FRow label="Fee rate (%)" hint="Percentage of transfer amount">
            <input type="number" step="0.001" min="0" max="100" className="input-field" required
              value={form.fee_rate}
              onChange={e => set('fee_rate', e.target.value)} />
          </FRow>
          <FRow label="Flat fee" hint="Fixed amount added to fee">
            <input type="number" step="0.01" min="0" className="input-field"
              value={form.fee_flat}
              onChange={e => set('fee_flat', e.target.value)} />
          </FRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FRow label="Min fee" hint="Fee floor (in sender currency)">
            <input type="number" step="0.01" min="0" className="input-field" placeholder="—"
              value={form.min_fee}
              onChange={e => set('min_fee', e.target.value)} />
          </FRow>
          <FRow label="Max fee" hint="Fee cap (in sender currency)">
            <input type="number" step="0.01" min="0" className="input-field" placeholder="—"
              value={form.max_fee}
              onChange={e => set('max_fee', e.target.value)} />
          </FRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FRow label="Min amount" hint="Rule applies only when amount ≥ this">
            <input type="number" step="0.01" min="0" className="input-field" placeholder="—"
              value={form.min_amount}
              onChange={e => set('min_amount', e.target.value)} />
          </FRow>
          <FRow label="Max amount" hint="Rule applies only when amount ≤ this">
            <input type="number" step="0.01" min="0" className="input-field" placeholder="—"
              value={form.max_amount}
              onChange={e => set('max_amount', e.target.value)} />
          </FRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FRow label="Priority" hint="Higher = checked first">
            <input type="number" className="input-field"
              value={form.priority}
              onChange={e => set('priority', e.target.value)} />
          </FRow>
          <FRow label="Active">
            <div className="flex items-center h-full pt-1">
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </FRow>
        </div>

        <FRow label="Note (optional)">
          <input className="input-field" placeholder="Internal memo…"
            value={form.note || ''}
            onChange={e => set('note', e.target.value)} />
        </FRow>

        {/* Fee preview summary */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700 mb-1">Rule summary</p>
          <p>Fee = <span className="font-mono font-medium text-gray-900">{parseFloat(form.fee_rate || 0).toFixed(3)}%</span> of amount
            {parseFloat(form.fee_flat || 0) > 0 && <> + <span className="font-mono font-medium text-gray-900">{form.fee_flat}</span> flat</>}
          </p>
          <p>
            Matches:&nbsp;
            <span className="font-medium text-gray-700">
              {form.from_currency || 'ANY'} → {form.to_currency || 'ANY'}
              {(form.min_amount || form.max_amount) && ` · ${form.min_amount || '0'} – ${form.max_amount || '∞'}`}
            </span>
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function FRow({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1">· {hint}</span>}
      </label>
      {children}
    </div>
  )
}

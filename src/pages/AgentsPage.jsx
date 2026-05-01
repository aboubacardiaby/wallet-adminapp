import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Search, ChevronLeft, ChevronRight, Plus, Pencil,
  Trash2, ToggleLeft, ToggleRight, MapPin, Phone,
  Globe, Store, AlertTriangle, Loader2,
} from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const COUNTRIES = [
  { name: 'Senegal',        flag: '🇸🇳', currency: 'XOF', dial: '+221' },
  { name: "Côte d'Ivoire",  flag: '🇨🇮', currency: 'XOF', dial: '+225' },
  { name: 'Mali',           flag: '🇲🇱', currency: 'XOF', dial: '+223' },
  { name: 'Burkina Faso',   flag: '🇧🇫', currency: 'XOF', dial: '+226' },
  { name: 'Niger',          flag: '🇳🇪', currency: 'XOF', dial: '+227' },
  { name: 'Togo',           flag: '🇹🇬', currency: 'XOF', dial: '+228' },
  { name: 'Benin',          flag: '🇧🇯', currency: 'XOF', dial: '+229' },
  { name: 'Guinea',         flag: '🇬🇳', currency: 'GNF', dial: '+224' },
  { name: 'Cameroon',       flag: '🇨🇲', currency: 'XAF', dial: '+237' },
  { name: 'Nigeria',        flag: '🇳🇬', currency: 'NGN', dial: '+234' },
  { name: 'Ghana',          flag: '🇬🇭', currency: 'GHS', dial: '+233' },
  { name: 'Kenya',          flag: '🇰🇪', currency: 'KES', dial: '+254' },
  { name: 'Morocco',        flag: '🇲🇦', currency: 'MAD', dial: '+212' },
  { name: 'South Africa',   flag: '🇿🇦', currency: 'ZAR', dial: '+27'  },
  { name: 'Egypt',          flag: '🇪🇬', currency: 'EGP', dial: '+20'  },
  { name: 'Ethiopia',       flag: '🇪🇹', currency: 'ETB', dial: '+251' },
  { name: 'Gambia',         flag: '🇬🇲', currency: 'GMD', dial: '+220' },
]

const countryByName = Object.fromEntries(COUNTRIES.map(c => [c.name, c]))

// Matches the backend AgentRequest schema exactly
const EMPTY_FORM = {
  business_name: '',
  phone_number:  '',
  address:       '',
  country:       '',
  latitude:      '',
  longitude:     '',
  cash_in_limit:  '',
  cash_out_limit: '',
  commission:    '',
  user_id:       '',
}

export default function AgentsPage() {
  const [agents,   setAgents]   = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filters,  setFilters]  = useState({ country: '', status: '' })
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search)          params.set('search', search)
      if (filters.country) params.set('country', filters.country)
      if (filters.status)  params.set('status', filters.status)
      const { data } = await api.get(`/admin/agents?${params}`)
      setAgents(data.agents ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch { toast.error('Failed to load agents') }
    finally  { setLoading(false) }
  }, [search, filters, page])

  useEffect(() => { setPage(1); load(1) }, [search, filters])
  useEffect(() => { load(page) }, [page])

  const toggleStatus = async (agent) => {
    const newStatus = agent.is_active ? 'inactive' : 'active'
    try {
      await api.put(`/admin/agents/${agent.id}/status`, { status: newStatus })
      toast.success(agent.is_active ? 'Agent deactivated' : 'Agent activated')
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.delete(`/admin/agents/${deleting.id}`)
      toast.success('Agent removed')
      setDeleting(null)
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete agent')
    }
  }

  const activeCount    = agents.filter(a => a.is_active).length
  const countriesShown = [...new Set(agents.map(a => a.country).filter(Boolean))].length

  return (
    <div>
      <PageHeader
        title="Cash Pickup Agents"
        subtitle={`${total.toLocaleString()} registered agents`}
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            <Plus size={15} /> Register Agent
          </button>
        }
      />

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard icon={Store}  label="Total agents"      value={total.toLocaleString()}   iconBg="bg-amber-50"  iconColor="text-amber-600"  />
        <SummaryCard icon={Globe}  label="Countries (page)"  value={countriesShown}           iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <SummaryCard icon={MapPin} label="Active (page)"     value={activeCount}              iconBg="bg-green-50"  iconColor="text-green-600"  />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by business name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-52"
          value={filters.country}
          onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
        >
          <option value="">All countries</option>
          {COUNTRIES.map(c => (
            <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
          ))}
        </select>
        <select
          className="input-field w-36"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Agent', 'Location', 'Limits', 'Commission', 'Status', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner /></td></tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Store size={32} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 text-sm">No agents found</p>
                    <button
                      className="btn-primary mt-3 text-xs"
                      onClick={() => { setEditing(null); setShowForm(true) }}
                    >
                      Register first agent
                    </button>
                  </td>
                </tr>
              ) : agents.map(agent => {
                const c = countryByName[agent.country]
                return (
                  <tr key={agent.id} className={`hover:bg-gray-50 transition-colors ${!agent.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">
                          {c?.flag ?? '🏪'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{agent.business_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={10} className="text-gray-300" />
                            {agent.phone_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium">{agent.country || '—'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{agent.address || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>In: {Number(agent.cash_in_limit).toLocaleString()}</p>
                      <p>Out: {Number(agent.cash_out_limit).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {Number(agent.commission) > 0
                        ? `${(Number(agent.commission) * 100).toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={agent.status ?? (agent.is_active ? 'active' : 'inactive')} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleStatus(agent)}
                          title={agent.is_active ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                        >
                          {agent.is_active
                            ? <ToggleRight size={16} className="text-green-500" />
                            : <ToggleLeft  size={16} />}
                        </button>
                        <button
                          onClick={() => { setEditing(agent); setShowForm(true) }}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(agent)}
                          title="Remove"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} agents</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AgentFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load(page) }}
        />
      )}

      {deleting && (
        <Modal title="Remove Agent" onClose={() => setDeleting(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Removing <span className="font-bold">{deleting.business_name}</span> will prevent them
                from appearing in cash pickup assignments. Existing transactions are not affected.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={confirmDelete}>Remove Agent</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Agent Form Modal ───────────────────────────────────────────────────────────

function AgentFormModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial ? {
      business_name:  initial.business_name  ?? '',
      phone_number:   initial.phone_number   ?? '',
      address:        initial.address        ?? '',
      country:        initial.country        ?? '',
      latitude:       initial.latitude != null && initial.latitude !== 0 ? String(initial.latitude) : '',
      longitude:      initial.longitude != null && initial.longitude !== 0 ? String(initial.longitude) : '',
      cash_in_limit:  initial.cash_in_limit  ? String(initial.cash_in_limit)  : '',
      cash_out_limit: initial.cash_out_limit ? String(initial.cash_out_limit) : '',
      commission:     initial.commission     ? String(initial.commission)     : '',
      user_id:        initial.user_id        ?? '',
    } : {}),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.business_name.trim()) e.business_name = 'Business name is required'
    if (!form.phone_number.trim())  e.phone_number  = 'Phone number is required'
    if (!form.country.trim())       e.country       = 'Country is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      // Build payload matching AgentRequest schema exactly
      const payload = {
        business_name:  form.business_name.trim(),
        phone_number:   form.phone_number.trim(),
        address:        form.address.trim(),
        country:        form.country.trim(),
        latitude:       form.latitude  !== '' ? parseFloat(form.latitude)  : 0.0,
        longitude:      form.longitude !== '' ? parseFloat(form.longitude) : 0.0,
        cash_in_limit:  form.cash_in_limit  !== '' ? parseFloat(form.cash_in_limit)  : 0.0,
        cash_out_limit: form.cash_out_limit !== '' ? parseFloat(form.cash_out_limit) : 0.0,
        commission:     form.commission !== '' ? parseFloat(form.commission) : 0.0,
        user_id:        form.user_id.trim() || null,
      }

      if (isEdit) {
        await api.put(`/admin/agents/${initial.id}`, payload)
        toast.success('Agent updated')
      } else {
        await api.post('/admin/agents', payload)
        toast.success('Agent registered')
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.detail
      if (Array.isArray(msg)) {
        // Pydantic validation errors come as an array
        toast.error(msg.map(e => e.msg).join(', '))
      } else {
        toast.error(msg || 'Failed to save agent')
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedCountry = countryByName[form.country]

  return (
    <Modal
      title={isEdit ? `Edit — ${initial.business_name}` : 'Register New Agent'}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5">

        {/* ── Identity ── */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agent Information</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Business name *" error={errors.business_name} className="col-span-2">
              <input
                className={`input-field ${errors.business_name ? 'border-red-300 focus:ring-red-400' : ''}`}
                placeholder="e.g. Diallo Express Money"
                value={form.business_name}
                onChange={e => set('business_name', e.target.value)}
              />
            </FormField>
            <FormField label="Phone number *" error={errors.phone_number}>
              <input
                className={`input-field ${errors.phone_number ? 'border-red-300 focus:ring-red-400' : ''}`}
                placeholder="+221 77 000 0000"
                value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)}
              />
            </FormField>
            <FormField label="User ID" hint="optional — link to a registered user">
              <input
                className="input-field font-mono text-xs"
                placeholder="UUID (leave blank if no linked account)"
                value={form.user_id}
                onChange={e => set('user_id', e.target.value)}
              />
            </FormField>
          </div>
        </section>

        {/* ── Location ── */}
        <section className="border-t border-gray-50 pt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country *" error={errors.country}>
              <select
                className={`input-field ${errors.country ? 'border-red-300 focus:ring-red-400' : ''}`}
                value={form.country}
                onChange={e => set('country', e.target.value)}
              >
                <option value="">Select country…</option>
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Address">
              <input
                className="input-field"
                placeholder="Street address, city, landmark"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </FormField>
            <FormField label="Latitude" hint="optional">
              <input
                className="input-field"
                type="number"
                step="0.000001"
                placeholder="e.g. 14.6928"
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
              />
            </FormField>
            <FormField label="Longitude" hint="optional">
              <input
                className="input-field"
                type="number"
                step="0.000001"
                placeholder="e.g. -17.4467"
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
              />
            </FormField>
          </div>

          {/* Live preview */}
          {(form.business_name || form.country) && (
            <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
                {selectedCountry?.flag ?? '🏪'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{form.business_name || '—'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-gray-400" />
                  {[form.address, form.country].filter(Boolean).join(', ') || '—'}
                </p>
                {form.phone_number && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="text-gray-300" /> {form.phone_number}
                  </p>
                )}
              </div>
              {selectedCountry && (
                <span className="badge bg-indigo-50 text-indigo-600 font-mono self-start">
                  {selectedCountry.currency}
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── Financial settings ── */}
        <section className="border-t border-gray-50 pt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Financial Settings</p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Cash-in limit" hint="max per txn">
              <input
                className="input-field"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={form.cash_in_limit}
                onChange={e => set('cash_in_limit', e.target.value)}
              />
            </FormField>
            <FormField label="Cash-out limit" hint="max per txn">
              <input
                className="input-field"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={form.cash_out_limit}
                onChange={e => set('cash_out_limit', e.target.value)}
              />
            </FormField>
            <FormField label="Commission" hint="rate e.g. 0.01 = 1%">
              <input
                className="input-field"
                type="number"
                step="0.001"
                min="0"
                max="1"
                placeholder="0.00"
                value={form.commission}
                onChange={e => set('commission', e.target.value)}
              />
            </FormField>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Register Agent'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function FormField({ label, hint, error, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
        {hint && <span className="font-normal text-gray-400 ml-1">· {hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

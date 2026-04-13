import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const EMPTY = { name: '', country: '', country_code: '', swift_code: '', logo_url: '', currency: '', is_active: true }

export default function BanksPage() {
  const [banks,     setBanks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)   // bank object or null

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/banks')
      setBanks(data.banks)
    } catch { toast.error('Failed to load banks') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const del = async (b) => {
    if (!confirm(`Delete "${b.name}"?`)) return
    try {
      await api.delete(`/admin/banks/${b.id}`)
      toast.success('Bank deleted')
      setBanks(bs => bs.filter(x => x.id !== b.id))
    } catch { toast.error('Failed to delete') }
  }

  const openEdit = (b) => { setEditing(b); setShowForm(true) }
  const openNew  = ()  => { setEditing(null); setShowForm(true) }

  return (
    <div>
      <PageHeader
        title="Banks"
        subtitle={`${banks.length} configured`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={openNew}>
            <Plus size={15} /> Add Bank
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : banks.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No banks configured yet</p>
          <button className="btn-primary mt-4" onClick={openNew}>Add first bank</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banks.map(b => (
            <BankCard key={b.id} bank={b} onEdit={openEdit} onDelete={del} onToggle={async () => {
              try {
                await api.put(`/admin/banks/${b.id}`, { ...b, is_active: !b.is_active })
                load()
              } catch { toast.error('Failed to update') }
            }} />
          ))}
        </div>
      )}

      {showForm && (
        <BankFormModal
          initial={editing || EMPTY}
          isEdit={!!editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function BankCard({ bank: b, onEdit, onDelete, onToggle }) {
  return (
    <div className={`card p-4 transition-opacity ${b.is_active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        {b.logo_url ? (
          <img src={b.logo_url} alt={b.name} className="w-10 h-10 rounded-lg object-contain border border-gray-100" />
        ) : (
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-indigo-500" />
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={onToggle} title={b.is_active ? 'Disable' : 'Enable'}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            {b.is_active
              ? <ToggleRight size={16} className="text-green-500" />
              : <ToggleLeft  size={16} />}
          </button>
          <button onClick={() => onEdit(b)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(b)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="font-semibold text-gray-900">{b.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{b.country}{b.country_code ? ` (${b.country_code})` : ''}</p>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {b.currency && <span className="badge bg-indigo-50 text-indigo-600">{b.currency}</span>}
        {b.swift_code && <span className="badge bg-gray-100 text-gray-500 font-mono">{b.swift_code}</span>}
        <span className={`badge ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {b.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

function BankFormModal({ initial, isEdit, onClose, onSaved }) {
  const [form, setForm] = useState({ ...initial })
  const [saving, setSaving] = useState(false)

  const f = (name) => ({
    value: form[name],
    onChange: e => setForm(f => ({ ...f, [name]: e.target.value })),
  })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/admin/banks/${form.id}`, form)
        toast.success('Bank updated')
      } else {
        await api.post('/admin/banks', form)
        toast.success('Bank added')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save bank')
    } finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Bank' : 'Add Bank'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Row label="Bank Name *">
          <input className="input-field" required {...f('name')} placeholder="e.g. Ecobank Senegal" />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Country *">
            <input className="input-field" required {...f('country')} placeholder="Senegal" />
          </Row>
          <Row label="Country Code">
            <input className="input-field" {...f('country_code')} placeholder="SN" maxLength={4} />
          </Row>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Row label="SWIFT / BIC">
            <input className="input-field" {...f('swift_code')} placeholder="ECOCUS33" />
          </Row>
          <Row label="Currency">
            <input className="input-field" {...f('currency')} placeholder="XOF" maxLength={5} />
          </Row>
        </div>
        <Row label="Logo URL">
          <input className="input-field" {...f('logo_url')} placeholder="https://…" />
        </Row>
        <div className="flex items-center justify-between py-1">
          <label className="text-sm font-medium text-gray-700">Active</label>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Bank' : 'Add Bank'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

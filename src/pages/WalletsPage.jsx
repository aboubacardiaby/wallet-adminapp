import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'XOF', 'XAF', 'NGN', 'GHS', 'KES', 'MAD', 'GMD', 'GNF']

export default function WalletsPage() {
  const [wallets,  setWallets]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search) params.set('search', search)
      const { data } = await api.get(`/admin/wallets?${params}`)
      setWallets(data.wallets)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast.error('Failed to load wallets') }
    finally  { setLoading(false) }
  }, [search, page])

  useEffect(() => { setPage(1); load(1) }, [search])
  useEffect(() => { load(page) }, [page])

  return (
    <div>
      <PageHeader
        title="Wallets"
        subtitle={`${total.toLocaleString()} total`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Wallet
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-9" placeholder="Search by user phone or name…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Balance', 'Currency', 'Status', 'Daily Limit', 'Monthly Limit', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Spinner /></td></tr>
            ) : wallets.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">No wallets found</td></tr>
            ) : wallets.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{w.user_name || '—'}</p>
                  <p className="text-xs text-gray-400">{w.user_phone}</p>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">
                  {Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-indigo-50 text-indigo-700">{w.currency}</span>
                </td>
                <td className="px-4 py-3"><Badge value={w.status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {Number(w.daily_limit).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {Number(w.monthly_limit).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditTarget(w)} title="Edit"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateWalletModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(page) }} />
      )}
      {editTarget && (
        <EditWalletModal wallet={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load(page) }} />
      )}
    </div>
  )
}

function CreateWalletModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    user_id: '', currency: 'XOF', initial_balance: 0,
    daily_limit: 500000, monthly_limit: 2000000,
  })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/wallets', form)
      toast.success('Wallet created')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create wallet')
    } finally { setSaving(false) }
  }

  const F = ({ label, name, type = 'text', children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children || (
        <input type={type} className="input-field" value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
      )}
    </div>
  )

  return (
    <Modal title="Create Wallet" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <F label="User ID (UUID)" name="user_id">
          <input className="input-field" required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} />
        </F>
        <F label="Currency" name="currency">
          <select className="input-field" value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F label="Initial Balance" name="initial_balance" type="number" />
        <F label="Daily Limit"     name="daily_limit"     type="number" />
        <F label="Monthly Limit"   name="monthly_limit"   type="number" />
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Creating…' : 'Create Wallet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditWalletModal({ wallet: w, onClose, onSaved }) {
  const [form, setForm] = useState({
    balance: Number(w.balance),
    status: w.status,
    currency: w.currency,
    daily_limit: Number(w.daily_limit),
    monthly_limit: Number(w.monthly_limit),
  })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/admin/wallets/${w.id}`, form)
      toast.success('Wallet updated')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Edit Wallet" onClose={onClose}>
      <p className="text-xs text-gray-400 mb-4">{w.user_name} · {w.user_phone}</p>
      <form onSubmit={submit} className="space-y-3">
        {[
          { label: 'Balance',       name: 'balance',       type: 'number' },
          { label: 'Daily Limit',   name: 'daily_limit',   type: 'number' },
          { label: 'Monthly Limit', name: 'monthly_limit', type: 'number' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input type={type} className="input-field" value={form[name]}
              onChange={e => setForm(f => ({ ...f, [name]: Number(e.target.value) }))} />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
          <select className="input-field" value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select className="input-field" value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

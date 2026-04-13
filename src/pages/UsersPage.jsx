import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Search, UserX, UserCheck, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState({ user_type: '', kyc_status: '' })
  const [detail,  setDetail]  = useState(null)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search)             params.set('search', search)
      if (filters.user_type)  params.set('user_type', filters.user_type)
      if (filters.kyc_status) params.set('kyc_status', filters.kyc_status)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast.error('Failed to load users') }
    finally  { setLoading(false) }
  }, [search, filters, page])

  useEffect(() => { load(1); setPage(1) }, [search, filters])
  useEffect(() => { load(page) }, [page])

  const toggleLock = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}/status`, { is_locked: !u.is_locked })
      toast.success(u.is_locked ? 'User unlocked' : 'User suspended')
      load(page)
    } catch { toast.error('Failed to update user') }
  }

  const openDetail = async (u) => {
    try {
      const { data } = await api.get(`/admin/users/${u.id}`)
      setDetail(data)
    } catch { toast.error('Failed to load user detail') }
  }

  return (
    <div>
      <PageHeader title="Users" subtitle={`${total.toLocaleString()} total`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by phone, name, email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-36" value={filters.user_type}
          onChange={e => setFilters(f => ({ ...f, user_type: e.target.value }))}>
          <option value="">All types</option>
          <option value="sender">Sender</option>
          <option value="receiver">Receiver</option>
        </select>
        <select className="input-field w-40" value={filters.kyc_status}
          onChange={e => setFilters(f => ({ ...f, kyc_status: e.target.value }))}>
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name / Phone', 'Type', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{u.phone_number}</p>
                  </td>
                  <td className="px-4 py-3"><Badge value={u.user_type} /></td>
                  <td className="px-4 py-3"><Badge value={u.kyc_status} /></td>
                  <td className="px-4 py-3">
                    {u.is_locked
                      ? <span className="badge bg-red-100 text-red-700">Suspended</span>
                      : <span className="badge bg-green-100 text-green-700">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(u)} title="View"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => toggleLock(u)}
                        title={u.is_locked ? 'Unlock' : 'Suspend'}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_locked
                          ? 'hover:bg-green-50 text-green-600 hover:text-green-700'
                          : 'hover:bg-red-50 text-red-400 hover:text-red-600'}`}>
                        {u.is_locked ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detail && (
        <UserDetailModal data={detail} onClose={() => setDetail(null)} onRefresh={() => load(page)} />
      )}
    </div>
  )
}

function UserDetailModal({ data, onClose, onRefresh }) {
  const { user: u, wallet, transaction_count } = data
  const [saving, setSaving] = useState(false)
  const [kyc,    setKyc]    = useState(u.kyc_status)
  const [locked, setLocked] = useState(u.is_locked)

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/users/${u.id}/status`, { kyc_status: kyc, is_locked: locked })
      toast.success('User updated')
      onRefresh()
      onClose()
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <Modal title="User Detail" onClose={onClose}>
      <div className="space-y-4">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Full name"    value={u.full_name || '—'} />
          <Field label="Phone"        value={u.phone_number} />
          <Field label="Email"        value={u.email || '—'} />
          <Field label="Type"         value={<Badge value={u.user_type} />} />
          <Field label="Country"      value={u.country || '—'} />
          <Field label="City"         value={u.city || '—'} />
          <Field label="Joined"       value={u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'} />
          <Field label="Transactions" value={transaction_count} />
        </div>

        {/* Wallet summary */}
        {wallet && (
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-2">Wallet</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-indigo-400">Balance</p>
                <p className="font-bold text-indigo-800">
                  {Number(wallet.balance).toLocaleString()} {wallet.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-indigo-400">Status</p>
                <Badge value={wallet.status} />
              </div>
              <div>
                <p className="text-xs text-indigo-400">Daily limit</p>
                <p className="font-medium text-indigo-800">{Number(wallet.daily_limit).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit controls */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">KYC Status</label>
            <select className="input-field" value={kyc} onChange={e => setKyc(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Account suspended</p>
              <p className="text-xs text-gray-400">Prevents the user from transacting</p>
            </div>
            <button
              onClick={() => setLocked(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${locked ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${locked ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}

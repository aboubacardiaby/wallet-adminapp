import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight,
  UserCog, Loader2, Eye, EyeOff, AlertTriangle,
} from 'lucide-react'
import api from '../api/client'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS, ROLE_COLORS } from '../lib/roles'

const ROLES = ['super_admin', 'manager', 'compliance', 'agent_supervisor', 'viewer']

const ROLE_DESCRIPTIONS = {
  super_admin:      'Full access — all pages, settings, admin user management',
  manager:          'Users, KYC, Wallets, Banks, Transactions, Agents',
  compliance:       'Users (read), KYC review, Transactions & Received Trans',
  agent_supervisor: 'Transactions processing, Agents management, Received Trans',
  viewer:           'Read-only access to all pages except Settings & Admin Users',
}

export default function AdminUsersPage() {
  const { username: currentUser } = useAuth()
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [pwdUser,  setPwdUser]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/admin-users')
      setUsers(data.admin_users ?? [])
    } catch { toast.error('Failed to load admin users') }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (user) => {
    try {
      await api.put(`/admin/admin-users/${user.id}`, { is_active: !user.is_active })
      toast.success(user.is_active ? 'User deactivated' : 'User activated')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.delete(`/admin/admin-users/${deleting.id}`)
      toast.success('Admin user removed')
      setDeleting(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle={`${users.length} admin account${users.length !== 1 ? 's' : ''}`}
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            <Plus size={15} /> Add Admin
          </button>
        }
      />

      {/* Role reference */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {ROLES.map(r => (
          <div key={r} className="card p-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Role', 'Email', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <UserCog size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400">No admin users yet. Create one above.</p>
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-xs font-bold uppercase">
                        {user.username[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      {user.username === currentUser && (
                        <p className="text-[10px] text-indigo-500 font-medium">You</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{user.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {user.username !== currentUser && (
                      <button onClick={() => toggleActive(user)} title={user.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        {user.is_active
                          ? <ToggleRight size={16} className="text-green-500" />
                          : <ToggleLeft  size={16} />}
                      </button>
                    )}
                    <button onClick={() => { setEditing(user); setShowForm(true) }}
                      title="Edit role" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setPwdUser(user)} title="Change password"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-500">
                      <KeyRound size={14} />
                    </button>
                    {user.username !== currentUser && (
                      <button onClick={() => setDeleting(user)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AdminUserFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
        />
      )}
      {pwdUser && (
        <PasswordModal
          user={pwdUser}
          onClose={() => setPwdUser(null)}
          onSaved={() => setPwdUser(null)}
        />
      )}
      {deleting && (
        <Modal title="Remove Admin User" onClose={() => setDeleting(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Remove <span className="font-bold">{deleting.username}</span>? They will no longer be able to log in.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Create / Edit Modal ────────────────────────────────────────────────────────

function AdminUserFormModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    username: initial?.username ?? '',
    email:    initial?.email    ?? '',
    password: '',
    role:     initial?.role     ?? 'viewer',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.role) { toast.error('Select a role'); return }
    if (!isEdit && !form.password) { toast.error('Password is required'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/admin/admin-users/${initial.id}`, {
          email:    form.email  || null,
          role:     form.role,
        })
        toast.success('Admin user updated')
      } else {
        await api.post('/admin/admin-users', {
          username: form.username.trim(),
          email:    form.email.trim() || null,
          password: form.password,
          role:     form.role,
        })
        toast.success('Admin user created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? `Edit — ${initial.username}` : 'New Admin User'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-sm">

        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Username *</label>
            <input className="input-field" placeholder="e.g. john_manager" required
              value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input className="input-field" type="email" placeholder="user@kalipeh.com"
            value={form.email} onChange={e => set('email', e.target.value)} />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Password *</label>
            <input className="input-field" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Role *</label>
          <div className="space-y-2">
            {ROLES.map(r => (
              <label key={r}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  form.role === r ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input type="radio" name="role" value={r} checked={form.role === r}
                  onChange={() => set('role', r)} className="mt-0.5 accent-indigo-600" />
                <div>
                  <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${ROLE_COLORS[r]}`}>
                    {ROLE_LABELS[r]}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{ROLE_DESCRIPTIONS[r]}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Admin'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Password Change Modal ──────────────────────────────────────────────────────

function PasswordModal({ user, onClose, onSaved }) {
  const [pwd,     setPwd]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [show,    setShow]    = useState(false)
  const [saving,  setSaving]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (pwd.length < 6)    { toast.error('Password must be at least 6 characters'); return }
    if (pwd !== confirm)   { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      await api.put(`/admin/admin-users/${user.id}/password`, { new_password: pwd })
      toast.success(`Password updated for ${user.username}`)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Change Password — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">New password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="••••••••"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Confirm password</label>
          <input
            type={show ? 'text' : 'password'}
            className="input-field"
            placeholder="••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </button>
        </div>
      </form>
    </Modal>
  )
}

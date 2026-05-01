import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Search, ChevronLeft, ChevronRight, Eye,
  MapPin, Phone, AlertTriangle, Loader2, UserCheck,
} from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

// Actual transaction types that appear in this view
const TX_TYPES = [
  { value: '',              label: 'All types'     },
  { value: 'cash_pickup',  label: 'Cash pickup'   },
  { value: 'wave_transfer', label: 'Wave'          },
  { value: 'send',         label: 'Wallet send'   },
]
const STATUSES = ['', 'pending', 'ready_for_pickup', 'wave_initiated', 'picked_up', 'completed', 'failed']

// Statuses where agent assignment is still actionable for cash_pickup
const ASSIGNABLE = new Set(['pending', 'ready_for_pickup'])

// Helper: pull a value from the row directly or from extra_data
const ex = (row, key) => row[key] ?? row.extra_data?.[key] ?? null

export default function ReceivedTransPage() {
  const [rows,     setRows]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filters,  setFilters]  = useState({ delivery_type: '', status: '' })
  const [detail,   setDetail]   = useState(null)
  const [assignTx, setAssignTx] = useState(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search)                params.set('search', search)
      if (filters.delivery_type) params.set('delivery_type', filters.delivery_type)
      if (filters.status)        params.set('status', filters.status)
      const { data } = await api.get(`/admin/received-trans?${params}`)
      setRows(data.items ?? data.transactions ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch { toast.error('Failed to load received transactions') }
    finally  { setLoading(false) }
  }, [search, filters])

  useEffect(() => { setPage(1); load(1) }, [search, filters, load])
  useEffect(() => { load(page) },          [page, load])

  const handleAssigned = () => {
    setAssignTx(null)
    load(page)
  }

  return (
    <div>
      <PageHeader title="Received Transactions" subtitle={`${total.toLocaleString()} total`} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by ref, phone, pickup code…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-48" value={filters.delivery_type}
          onChange={e => setFilters(f => ({ ...f, delivery_type: e.target.value }))}>
          {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input-field w-44" value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ref', 'Sender', 'Recipient', 'Amount', 'Type', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Spinner /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No received transactions</td></tr>
              ) : rows.map(r => {
                const recipientName = ex(r, 'recipient_name')
                const pickupCode    = ex(r, 'pickup_code')
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {r.transaction_ref?.slice(0, 12)}…
                    </td>
                    {/* Sender */}
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {r.from_phone || '—'}
                    </td>
                    {/* Recipient */}
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium">{recipientName || r.to_phone || '—'}</p>
                      {recipientName && r.to_phone && (
                        <p className="text-xs text-gray-400">{r.to_phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span className="text-xs text-gray-400 font-normal ml-1">{r.currency}</span>
                    </td>
                    <td className="px-4 py-3"><Badge value={r.type} /></td>
                    <td className="px-4 py-3"><Badge value={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Assign agent — only for cash_pickup in actionable state */}
                        {r.type === 'cash_pickup' && ASSIGNABLE.has(r.status) && (
                          <button
                            onClick={() => setAssignTx(r)}
                            title="Assign agent"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors"
                          >
                            <UserCheck size={13} />
                            Assign
                          </button>
                        )}
                        <button onClick={() => setDetail(r)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                          <Eye size={14} />
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
            <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} total</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onAssign={r => { setDetail(null); setAssignTx(r) }}
        />
      )}
      {assignTx && (
        <AssignAgentModal
          row={assignTx}
          onClose={() => setAssignTx(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  )
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function DetailModal({ row, onClose, onAssign }) {
  const extra = row.extra_data ?? {}
  return (
    <Modal title="Received Transaction Detail" onClose={onClose} wide>
      <div className="space-y-3 text-sm">
        <F label="Reference" value={row.transaction_ref} mono />
        <F label="Type"      value={<Badge value={row.type} />} />
        <F label="Status"    value={<Badge value={row.status} />} />

        {/* ── Sender ── */}
        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sender</p>
        <F label="Phone"    value={row.from_phone || '—'} mono />
        <F label="Sent"     value={`${Number(row.amount).toLocaleString()} ${extra.send_currency ?? row.currency}`} bold />
        {row.fee != null && row.fee > 0 && (
          <F label="Fee"    value={`${Number(row.fee).toLocaleString()} ${extra.send_currency ?? row.currency}`} />
        )}
        {extra.exchange_rate && extra.recv_currency && (
          <F label="Rate"   value={`1 ${extra.send_currency ?? row.currency} = ${Number(extra.exchange_rate).toFixed(6)} ${extra.recv_currency}`} />
        )}

        {/* ── Recipient ── */}
        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</p>
        <F label="Name"     value={extra.recipient_name || '—'} />
        <F label="Phone"    value={row.to_phone || '—'} mono />
        {extra.received_amount != null && (
          <F label="Receives" value={`${Number(extra.received_amount).toLocaleString()} ${extra.recv_currency ?? row.currency}`} bold />
        )}

        {/* ── Agent / Cash pickup ── */}
        {row.type === 'cash_pickup' && (
          <>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={11} /> Agent / Cash Pickup
              </p>
              {ASSIGNABLE.has(row.status) && (
                <button
                  onClick={() => onAssign(row)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors"
                >
                  <UserCheck size={12} /> Assign Agent
                </button>
              )}
            </div>
            <F label="Pickup code" value={<span className="font-mono font-black text-amber-700">{extra.pickup_code || '—'}</span>} />
            <F label="Agent"       value={extra.agent_name    || '—'} />
            <F label="Address"     value={extra.agent_address || '—'} />
            <F label="City"        value={extra.agent_city    || '—'} />
            <F label="Country"     value={extra.agent_country || '—'} />
            <F label="Phone"       value={extra.agent_phone   || '—'} />
          </>
        )}

        {/* ── Wave ── */}
        {row.type === 'wave_transfer' && (
          <>
            <hr className="border-gray-100" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wave</p>
            <F label="Transfer ID" value={extra.wave_transfer_id || '—'} mono />
            <F label="Wave ref"    value={extra.wave_ref         || '—'} mono />
            <F label="Wave status" value={extra.wave_status ? <Badge value={extra.wave_status} /> : '—'} />
          </>
        )}

        <hr className="border-gray-100" />
        <F label="Created" value={row.created_at ? new Date(row.created_at).toLocaleString() : '—'} />

        {row.extra_data && (
          <div className="bg-gray-50 rounded-xl p-3 mt-2">
            <p className="text-xs font-semibold text-gray-400 mb-2">Extra data</p>
            <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(row.extra_data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Assign Agent Modal ─────────────────────────────────────────────────────────

function AssignAgentModal({ row, onClose, onAssigned }) {
  const extra         = row.extra_data ?? {}
  const destCountry   = extra.agent_country || ''
  const pickupCode    = extra.pickup_code   || '—'
  const recipientName = extra.recipient_name || row.to_phone || '—'
  const payoutAmount  = extra.received_amount != null
    ? `${Number(extra.received_amount).toLocaleString()} ${extra.recv_currency ?? row.currency}`
    : `${Number(row.amount).toLocaleString()} ${row.currency}`

  const [agents,   setAgents]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!destCountry) return
    setLoading(true)
    api.get(`/admin/agents?country=${encodeURIComponent(destCountry)}&status=active&limit=50`)
      .then(({ data }) => setAgents(data.agents ?? []))
      .catch(() => toast.error('Failed to load agents'))
      .finally(() => setLoading(false))
  }, [destCountry])

  const assign = async () => {
    if (!selected) { toast.error('Select an agent first'); return }
    setSaving(true)
    try {
      await api.put(`/admin/transactions/${row.id}/cash-pickup`, {
        action: 'assign',
        agent_id: selected,
      })
      toast.success('Agent assigned successfully')
      onAssigned()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign agent')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Assign Cash Pickup Agent" onClose={onClose} wide>
      <div className="space-y-4 text-sm">

        {/* Transaction summary */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-amber-600 font-semibold mb-0.5">Recipient</p>
            <p className="font-semibold text-gray-800">{recipientName}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 font-semibold mb-0.5">Pickup Code</p>
            <p className="font-mono font-black text-xl text-amber-800">{pickupCode}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 font-semibold mb-0.5">Destination Country</p>
            <p className="font-semibold text-gray-800">{destCountry || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 font-semibold mb-0.5">Payout Amount</p>
            <p className="font-bold text-gray-900">{payoutAmount}</p>
          </div>
        </div>

        {/* Agent selection — destination country only */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Active Agents in {destCountry || '—'}
          </p>

          {!destCountry ? (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                No destination country found on this transaction. Cannot filter agents.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 py-4 text-gray-400 text-xs">
              <Loader2 size={14} className="animate-spin" /> Loading agents in {destCountry}…
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                No active agents registered in <strong>{destCountry}</strong>.
                Go to the <strong>Agents</strong> page to register one.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {agents.map(agent => (
                <label
                  key={agent.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selected === agent.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="agent"
                    value={agent.id}
                    checked={selected === agent.id}
                    onChange={() => setSelected(agent.id)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{agent.business_name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {agent.phone_number && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10} /> {agent.phone_number}
                        </span>
                      )}
                      {agent.address && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10} /> {agent.address}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            onClick={assign}
            disabled={saving || !selected}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            Assign Agent
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function F({ label, value, mono, bold }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-gray-900' : 'text-gray-700'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}

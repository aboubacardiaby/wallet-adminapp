import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Search, ChevronLeft, ChevronRight, Eye,
  MapPin, Phone, AlertTriangle, Loader2, UserCheck,
  X, Inbox, ArrowRight,
} from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const TX_TYPES = [
  { value: '',              label: 'All types'   },
  { value: 'cash_pickup',  label: 'Cash pickup' },
  { value: 'wave_transfer', label: 'Wave'        },
  { value: 'send',         label: 'Wallet send' },
]
const STATUSES = ['', 'pending', 'ready_for_pickup', 'wave_initiated', 'picked_up', 'completed', 'failed']

const ASSIGNABLE = new Set(['pending', 'ready_for_pickup'])

const ex = (row, key) => row[key] ?? row.extra_data?.[key] ?? null

function pageNums(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3)  return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', cur - 1, cur, cur + 1, '…', total]
}

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

  const handleAssigned = () => { setAssignTx(null); load(page) }
  const hasFilters = search || filters.delivery_type || filters.status
  const clearFilters = () => { setSearch(''); setFilters({ delivery_type: '', status: '' }) }

  return (
    <div>
      <PageHeader title="Received Transactions" subtitle={`${total.toLocaleString()} total`} />

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
              placeholder="Search by ref, phone, pickup code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
            value={filters.delivery_type}
            onChange={e => setFilters(f => ({ ...f, delivery_type: e.target.value }))}>
            {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sender → Recipient</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Inbox size={32} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No received transactions found</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : rows.map(r => {
                const recipientName = ex(r, 'recipient_name')
                return (
                  <tr key={r.id}
                    onClick={() => setDetail(r)}
                    className="hover:bg-indigo-50/20 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 group-hover:border-gray-200 px-2 py-0.5 rounded-md inline-block mb-1.5 transition-colors">
                        {r.transaction_ref?.slice(0, 12)}…
                      </span>
                      <div><Badge value={r.type} /></div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        {r.sender_name && <p className="text-xs font-medium text-gray-800">{r.sender_name}</p>}
                        <p className="text-xs text-gray-400 font-mono">{r.from_phone || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-800">{recipientName || r.to_phone || '—'}</p>
                          {recipientName && r.to_phone && (
                            <p className="text-xs text-gray-400 font-mono">{r.to_phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">
                        {Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        <span className="text-xs text-gray-400 font-normal ml-1">{r.currency}</span>
                      </p>
                    </td>
                    <td className="px-4 py-4"><Badge value={r.status} /></td>
                    <td className="px-4 py-4">
                      {r.created_at ? (
                        <>
                          <p className="text-xs text-gray-700 font-medium">
                            {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end">
                        {r.type === 'cash_pickup' && ASSIGNABLE.has(r.status) && (
                          <button
                            onClick={() => setAssignTx(r)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors border border-amber-100"
                          >
                            <UserCheck size={13} /> Assign
                          </button>
                        )}
                        <button
                          onClick={() => setDetail(r)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
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

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-700">{((page - 1) * 20) + 1}–{Math.min(page * 20, total)}</span> of <span className="font-medium text-gray-700">{total.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors text-gray-600">
                <ChevronLeft size={14} />
              </button>
              {pageNums(page, pages).map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      n === page ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-gray-200 text-gray-600'
                    }`}>
                    {n}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors text-gray-600">
                <ChevronRight size={14} />
              </button>
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
      <div className="space-y-4">

        {/* Status header */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Badge value={row.type} />
            <span className="font-mono text-xs text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg">
              {row.transaction_ref}
            </span>
          </div>
          <Badge value={row.status} />
        </div>

        {/* Sender */}
        <Section title="Sender">
          <div className="grid grid-cols-2 gap-4">
            <PartyField label="Sender" name={row.sender_name} phone={row.from_phone} />
            <DField label="Sent" value={`${Number(row.amount).toLocaleString()} ${extra.send_currency ?? row.currency}`} bold />
            {row.fee != null && row.fee > 0 && (
              <DField label="Fee" value={`${Number(row.fee).toLocaleString()} ${extra.send_currency ?? row.currency}`} />
            )}
            {extra.exchange_rate && extra.recv_currency && (
              <DField label="Rate" value={`1 ${extra.send_currency ?? row.currency} = ${Number(extra.exchange_rate).toFixed(6)} ${extra.recv_currency}`} mono />
            )}
          </div>
        </Section>

        {/* Recipient */}
        <Section title="Recipient">
          <div className="grid grid-cols-2 gap-4">
            <PartyField label="Recipient" name={row.recipient_name || extra.recipient_name} phone={row.to_phone} />
            {extra.received_amount != null && (
              <DField label="Receives" value={`${Number(extra.received_amount).toLocaleString()} ${extra.recv_currency ?? row.currency}`} bold />
            )}
          </div>
        </Section>

        {/* Cash pickup */}
        {row.type === 'cash_pickup' && (
          <Section title="Agent / Cash Pickup">
            <div className="flex items-center justify-between mb-3">
              <span />
              {ASSIGNABLE.has(row.status) && (
                <button
                  onClick={() => onAssign(row)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors border border-amber-100"
                >
                  <UserCheck size={12} /> Assign Agent
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Pickup code</p>
                <p className="font-mono font-black text-lg text-amber-700">{extra.pickup_code || '—'}</p>
              </div>
              <DField label="Agent" value={extra.agent_name || '—'} />
              <DField label="Address" value={extra.agent_address || '—'} />
              <DField label="City" value={extra.agent_city || '—'} />
              <DField label="Country" value={extra.agent_country || '—'} />
              <DField label="Agent phone" value={extra.agent_phone || '—'} mono />
            </div>
          </Section>
        )}

        {/* Wave */}
        {row.type === 'wave_transfer' && (
          <Section title="Wave Transfer">
            <div className="grid grid-cols-2 gap-4">
              <DField label="Transfer ID" value={extra.wave_transfer_id || '—'} mono />
              <DField label="Wave ref" value={extra.wave_ref || '—'} mono />
              <DField label="Wave status" value={extra.wave_status ? <Badge value={extra.wave_status} /> : '—'} />
            </div>
          </Section>
        )}

        <Section title="Metadata">
          <DField label="Created" value={row.created_at ? new Date(row.created_at).toLocaleString() : '—'} />
        </Section>

        {row.extra_data && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Extra Data</p>
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
      await api.put(`/admin/transactions/${row.id}/cash-pickup`, { action: 'assign', agent_id: selected })
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
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 grid grid-cols-2 gap-4">
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

        {/* Agent selection */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Active Agents in {destCountry || '—'}
          </p>

          {!destCountry ? (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">No destination country found on this transaction. Cannot filter agents.</p>
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
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {agents.map(agent => (
                <label key={agent.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selected === agent.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input type="radio" name="agent" value={agent.id}
                    checked={selected === agent.id}
                    onChange={() => setSelected(agent.id)}
                    className="mt-0.5 accent-amber-500" />
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

function Section({ title, children }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function DField({ label, value, mono, bold }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function PartyField({ label, name, phone }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {name && <p className="text-sm font-semibold text-gray-900">{name}</p>}
      <p className={`font-mono ${name ? 'text-xs text-gray-400 mt-0.5' : 'text-sm font-medium text-gray-700'}`}>
        {phone || '—'}
      </p>
    </div>
  )
}

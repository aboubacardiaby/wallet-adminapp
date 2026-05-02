import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  Search, ChevronLeft, ChevronRight, Eye,
  Banknote, MapPin, CheckCircle, XCircle,
  Loader2, User, AlertTriangle, Phone, Navigation,
  X, Inbox, ArrowRight,
} from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const TX_TYPES    = ['', 'remittance', 'send', 'cash_pickup', 'wave_transfer', 'top_up', 'cash_in', 'cash_out']
const TX_STATUSES = ['', 'completed', 'pending', 'failed']

const CASH_PICKUP_ACTIVE = new Set(['pending', 'ready_for_pickup'])

function pageNums(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3)  return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', cur - 1, cur, cur + 1, '…', total]
}

export default function TransactionsPage() {
  const [rows,       setRows]       = useState([])
  const [total,      setTotal]      = useState(0)
  const [pages,      setPages]      = useState(1)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filters,    setFilters]    = useState({ type: '', status: '' })
  const [detail,     setDetail]     = useState(null)
  const [processing, setProcessing] = useState(null)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (search)         params.set('search', search)
      if (filters.type)   params.set('type', filters.type)
      if (filters.status) params.set('status', filters.status)
      const { data } = await api.get(`/admin/transactions?${params}`)
      setRows(data.transactions)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast.error('Failed to load transactions') }
    finally  { setLoading(false) }
  }, [search, filters, page])

  useEffect(() => { setPage(1); load(1) }, [search, filters])
  useEffect(() => { load(page) }, [page])

  const handleProcessed = () => { setProcessing(null); load(page) }
  const hasFilters = search || filters.type || filters.status
  const clearFilters = () => { setSearch(''); setFilters({ type: '', status: '' }) }

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${total.toLocaleString()} total`} />

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
              placeholder="Search by ref, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            {TX_TYPES.map(t => <option key={t} value={t}>{t || 'All types'}</option>)}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            {TX_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
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
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">From → To</th>
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
                      <p className="text-sm font-medium">No transactions found</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : rows.map(t => (
                <tr key={t.id}
                  onClick={() => setDetail(t)}
                  className="hover:bg-indigo-50/20 cursor-pointer group transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 group-hover:border-gray-200 px-2 py-0.5 rounded-md inline-block mb-1.5 transition-colors">
                      {t.transaction_ref?.slice(0, 12)}…
                    </span>
                    <div><Badge value={t.type} /></div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      {t.sender_name && <p className="text-xs font-medium text-gray-800">{t.sender_name}</p>}
                      <p className="text-xs text-gray-400 font-mono">{t.from_phone || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{t.recipient_name || t.to_phone || '—'}</p>
                        {t.recipient_name && <p className="text-xs text-gray-400 font-mono">{t.to_phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">
                      {Number(t.send_amount ?? t.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span className="text-xs text-gray-400 font-normal ml-1">{t.send_currency ?? t.currency}</span>
                    </p>
                    {t.received_amount != null && t.recv_currency && t.recv_currency !== (t.send_currency ?? t.currency) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        ↓ {Number(t.received_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.recv_currency}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4"><Badge value={t.status} /></td>
                  <td className="px-4 py-4">
                    {t.created_at ? (
                      <>
                        <p className="text-xs text-gray-700 font-medium">
                          {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(t.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 justify-end">
                      {t.type === 'cash_pickup' && CASH_PICKUP_ACTIVE.has(t.status) && (
                        <button
                          onClick={() => setProcessing(t)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors border border-amber-100"
                        >
                          <Banknote size={13} /> Process
                        </button>
                      )}
                      {t.type === 'cash_pickup' && t.status === 'picked_up' && (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-semibold border border-green-100">
                          <CheckCircle size={13} /> Done
                        </span>
                      )}
                      <button
                        onClick={() => setDetail(t)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* ── Detail Modal ── */}
      {detail && (
        <Modal title="Transaction Detail" onClose={() => setDetail(null)} wide>
          <div className="space-y-4">
            {/* Status header */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Badge value={detail.type} />
                <span className="font-mono text-xs text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg">
                  {detail.transaction_ref}
                </span>
              </div>
              <Badge value={detail.status} />
            </div>

            <Section title="Parties">
              <div className="grid grid-cols-2 gap-4">
                <PartyField label="Sender" name={detail.sender_name} phone={detail.from_phone} />
                <PartyField label="Recipient" name={detail.recipient_name} phone={detail.to_phone} />
              </div>
            </Section>

            <Section title="Financial Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Number(detail.send_amount ?? detail.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-sm text-gray-400 font-normal ml-1">{detail.send_currency ?? detail.currency}</span>
                  </p>
                </div>
                {detail.received_amount != null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Received</p>
                    <p className="text-xl font-bold text-green-700">
                      {Number(detail.received_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span className="text-sm text-green-500 font-normal ml-1">{detail.recv_currency}</span>
                    </p>
                  </div>
                )}
                {detail.fee != null && (
                  <DField label="Fee" value={`${Number(detail.fee).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${detail.send_currency ?? detail.currency}`} />
                )}
                {detail.exchange_rate != null && detail.recv_currency && detail.recv_currency !== (detail.send_currency ?? detail.currency) && (
                  <DField label="Rate" value={`1 ${detail.send_currency ?? detail.currency} = ${Number(detail.exchange_rate).toFixed(6)} ${detail.recv_currency}`} mono />
                )}
              </div>
            </Section>

            {(detail.type === 'cash_pickup' || detail.pickup_code) && (
              <Section title="Cash Pickup">
                <DField label="Pickup code" value={detail.pickup_code || '—'} mono bold />
              </Section>
            )}

            {(detail.type === 'wave_transfer' || detail.wave_ref) && (
              <Section title="Wave Transfer">
                <div className="grid grid-cols-2 gap-4">
                  <DField label="Wave ref" value={detail.wave_ref || '—'} mono />
                  <DField label="Wave status" value={detail.wave_status ? <Badge value={detail.wave_status} /> : '—'} />
                </div>
              </Section>
            )}

            <Section title="Metadata">
              <div className="grid grid-cols-2 gap-4">
                <DField label="Description" value={detail.description || '—'} />
                <DField label="Created" value={detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'} />
              </div>
            </Section>

            {detail.extra_data && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Extra Data</p>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(detail.extra_data, null, 2)}
                </pre>
              </div>
            )}

            {detail.type === 'cash_pickup' && CASH_PICKUP_ACTIVE.has(detail.status) && (
              <button
                onClick={() => { setDetail(null); setProcessing(detail) }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl text-sm transition-colors border border-amber-100"
              >
                <Banknote size={15} />
                Open Cash Pickup Processor
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ── Cash Pickup Processor ── */}
      {processing && (
        <CashPickupProcessor
          tx={processing}
          onClose={() => setProcessing(null)}
          onDone={handleProcessed}
        />
      )}
    </div>
  )
}

// ── Cash Pickup Processor ──────────────────────────────────────────────────────

const STEPS = [
  { key: 'pending',          label: 'Awaiting Agent',  description: 'Assign an agent to handle the cash payout' },
  { key: 'ready_for_pickup', label: 'Agent Assigned',  description: 'Agent is ready — recipient can collect cash' },
  { key: 'picked_up',        label: 'Picked Up',       description: 'Recipient collected the cash' },
]

function stepIndex(status) {
  const i = STEPS.findIndex(s => s.key === status)
  return i === -1 ? 0 : i
}

function CashPickupProcessor({ tx, onClose, onDone }) {
  const [agents,        setAgents]        = useState([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(tx.agent_id || '')
  const [adminNotes,    setAdminNotes]    = useState('')
  const [saving,        setSaving]        = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const extra       = tx.extra_data ?? {}
  const destCountry = extra.agent_country || ''

  useEffect(() => {
    if (!destCountry) return
    setAgentsLoading(true)
    api.get(`/admin/agents?country=${encodeURIComponent(destCountry)}&status=active&limit=50`)
      .then(({ data }) => setAgents(data.agents ?? []))
      .catch(() => {})
      .finally(() => setAgentsLoading(false))
  }, [destCountry])

  useEffect(() => {
    if (tx.agent_id) setSelectedAgent(tx.agent_id)
  }, [tx.agent_id])

  const currentStep = stepIndex(tx.status)

  const act = async (action) => {
    if (action === 'assign' && !selectedAgent) { toast.error('Select an agent first'); return }
    setSaving(true)
    try {
      await api.put(`/admin/transactions/${tx.id}/cash-pickup`, {
        action,
        agent_id:    action === 'assign' ? selectedAgent : undefined,
        admin_notes: adminNotes || undefined,
      })
      const labels = { assign: 'Agent assigned', confirm: 'Pickup confirmed', cancel: 'Transfer cancelled' }
      toast.success(labels[action] ?? 'Updated')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    } finally {
      setSaving(false)
      setConfirmCancel(false)
    }
  }

  return (
    <Modal title="Cash Pickup — Manual Processing" onClose={onClose} wide>
      <div className="space-y-5 text-sm">

        {/* Pickup code hero */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pickup Code</p>
            <p className="text-3xl font-black tracking-widest text-amber-800 font-mono">
              {extra.pickup_code || '—'}
            </p>
            <p className="text-xs text-amber-500 mt-1">Share with recipient to verify identity</p>
          </div>
          <Banknote size={36} className="text-amber-300" />
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done   = i < currentStep
            const active = i === currentStep
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    done   ? 'bg-green-500 border-green-500 text-white' :
                    active ? 'bg-amber-500 border-amber-500 text-white' :
                             'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 text-center leading-tight ${
                    done ? 'text-green-600' : active ? 'text-amber-600' : 'text-gray-300'
                  }`}>{step.label}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-green-300' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Transaction summary */}
        <Section title="Transaction Summary">
          <div className="grid grid-cols-2 gap-3">
            <DField label="Reference"  value={tx.transaction_ref?.slice(0, 20) + '…'} mono />
            <DField label="Status"     value={<Badge value={tx.status} />} />
            <PartyField label="Sender"    name={tx.sender_name}    phone={tx.from_phone} />
            <PartyField label="Recipient" name={extra.recipient_name || tx.recipient_name} phone={tx.to_phone} />
            <DField label="Sent"       value={`${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${extra.send_currency ?? tx.currency}`} bold />
            {extra.received_amount != null && (
              <DField label="Payout"   value={`${Number(extra.received_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${extra.recv_currency ?? tx.currency}`} bold />
            )}
          </div>
        </Section>

        {/* Step 1: Agent assignment */}
        {tx.status === 'pending' && (
          <section className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <MapPin size={12} className="text-amber-600" />
              </div>
              <p className="font-semibold text-gray-800">Assign Agent</p>
            </div>
            <p className="text-xs text-gray-400">
              Only active agents registered in <span className="font-semibold text-gray-600">{destCountry || '—'}</span> are shown.
            </p>

            {agentsLoading ? (
              <div className="flex items-center gap-2 py-3 text-gray-400 text-xs">
                <Loader2 size={14} className="animate-spin" /> Loading agents…
              </div>
            ) : agents.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agents.map(agent => (
                  <label key={agent.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedAgent === agent.id
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input type="radio" name="agent" value={agent.id}
                      checked={selectedAgent === agent.id}
                      onChange={() => setSelectedAgent(agent.id)}
                      className="mt-0.5 accent-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{agent.business_name}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {agent.phone_number && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone size={10} /> {agent.phone_number}
                          </span>
                        )}
                        {agent.address && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Navigation size={10} /> {agent.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {destCountry
                    ? `No active agents registered in ${destCountry}. Go to the Agents page to register one.`
                    : 'No destination country found on this transaction.'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Step 2: Assigned agent + confirm pickup */}
        {tx.status === 'ready_for_pickup' && (
          <section className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <User size={12} className="text-green-600" />
              </div>
              <p className="font-semibold text-gray-800">Assigned Agent</p>
            </div>

            {extra.agent_name ? (
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="font-semibold text-gray-900">{extra.agent_name}</p>
                {extra.agent_phone   && <p className="text-xs text-gray-400 mt-0.5">{extra.agent_phone}</p>}
                {extra.agent_address && <p className="text-xs text-gray-400">{extra.agent_address}{extra.agent_city ? `, ${extra.agent_city}` : ''}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Agent ID: {tx.agent_id || '—'}</p>
            )}

            <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Banknote size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Waiting for recipient</p>
                <p className="text-xs text-gray-400">
                  Recipient must present code <span className="font-mono font-bold text-amber-700">{extra.pickup_code}</span> to agent
                </p>
              </div>
            </div>

            {agents.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium select-none">
                  Reassign to a different agent
                </summary>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                  {agents.map(agent => (
                    <label key={agent.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedAgent === agent.id ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <input type="radio" name="agent" value={agent.id}
                        checked={selectedAgent === agent.id}
                        onChange={() => setSelectedAgent(agent.id)}
                        className="mt-0.5 accent-amber-500" />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{agent.business_name}</p>
                        {agent.phone_number && <p className="text-xs text-gray-400">{agent.phone_number}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        {/* Admin notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Admin notes (optional)</label>
          <textarea
            className="input-field resize-none h-16 text-xs"
            placeholder="Internal notes about this pickup…"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          {tx.status === 'pending' && (
            <button
              onClick={() => act('assign')}
              disabled={saving || !selectedAgent}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
              Assign Agent & Mark Ready for Pickup
            </button>
          )}

          {tx.status === 'ready_for_pickup' && (
            <>
              {selectedAgent && selectedAgent !== tx.agent_id && (
                <button onClick={() => act('assign')} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                  Reassign Agent
                </button>
              )}
              <button onClick={() => act('confirm')} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Confirm Cash Handed to Recipient
              </button>
            </>
          )}

          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 font-medium rounded-xl text-sm transition-colors">
              <XCircle size={14} /> Cancel Transfer & Return Funds
            </button>
          ) : (
            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  This will cancel the transfer and return funds to the sender's wallet. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors">
                  Keep Transfer
                </button>
                <button onClick={() => act('cancel')} disabled={saving}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}
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

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const TX_TYPES   = ['', 'remittance', 'send', 'cash_pickup', 'wave_transfer', 'top_up', 'cash_in', 'cash_out']
const TX_STATUSES = ['', 'completed', 'pending', 'failed']

export default function TransactionsPage() {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState({ type: '', status: '' })
  const [detail,  setDetail]  = useState(null)

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

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${total.toLocaleString()} total`} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by ref, phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-44" value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          {TX_TYPES.map(t => <option key={t} value={t}>{t || 'All types'}</option>)}
        </select>
        <select className="input-field w-36" value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          {TX_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ref', 'Type', 'From', 'To', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Spinner /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No transactions</td></tr>
              ) : rows.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {t.transaction_ref?.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3"><Badge value={t.type} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.from_phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.to_phone || '—'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-xs text-gray-400 font-normal ml-1">{t.currency}</span>
                  </td>
                  <td className="px-4 py-3"><Badge value={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(t)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} total</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14}/></button>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <Modal title="Transaction Detail" onClose={() => setDetail(null)}>
          <div className="space-y-3 text-sm">
            <TxField label="Reference"   value={detail.transaction_ref} mono />
            <TxField label="Type"        value={<Badge value={detail.type} />} />
            <TxField label="Status"      value={<Badge value={detail.status} />} />
            <TxField label="From"        value={detail.from_phone || '—'} />
            <TxField label="To"          value={detail.to_phone   || '—'} />
            <TxField label="Amount"      value={`${Number(detail.amount).toLocaleString()} ${detail.currency}`} bold />
            <TxField label="Fee"         value={`${Number(detail.fee).toLocaleString()} ${detail.currency}`} />
            <TxField label="Description" value={detail.description || '—'} />
            <TxField label="Created"     value={detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'} />
            {detail.extra_data && (
              <div className="bg-gray-50 rounded-xl p-3 mt-2">
                <p className="text-xs font-semibold text-gray-400 mb-2">Extra data</p>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(detail.extra_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function TxField({ label, value, mono, bold }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-gray-900' : 'text-gray-700'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}

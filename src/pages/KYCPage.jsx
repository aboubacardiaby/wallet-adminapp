import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

const TABS = [
  { key: 'pending',      label: 'Pending',      icon: Clock         },
  { key: 'under_review', label: 'Under Review',  icon: Eye           },
  { key: 'verified',     label: 'Verified',      icon: CheckCircle   },
  { key: 'rejected',     label: 'Rejected',      icon: XCircle       },
]

export default function KYCPage() {
  const [tab,       setTab]       = useState('pending')
  const [rows,      setRows]      = useState([])
  const [total,     setTotal]     = useState(0)
  const [pages,     setPages]     = useState(1)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/kyc?kyc_status=${tab}&page=${p}&limit=15`)
      setRows(data.submissions)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast.error('Failed to load KYC') }
    finally  { setLoading(false) }
  }, [tab])

  useEffect(() => { setPage(1); load(1) }, [tab])
  useEffect(() => { load(page) }, [page])

  const review = async (id, action, reason = null) => {
    try {
      await api.put(`/admin/kyc/submissions/${id}/review`, {
        action,
        rejection_reason: reason,
        reviewer_id: 'admin',
      })
      toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'}`)
      load(page)
      setSelected(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Review failed')
    }
  }

  return (
    <div>
      <PageHeader title="KYC Review" subtitle={`${total} ${tab} submissions`} />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Applicant', 'Document', 'Country', 'Submitted', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  No {tab} submissions
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.full_name || r.user_name || '—'}</p>
                  <p className="text-xs text-gray-400">{r.user_phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700 capitalize">{r.id_type?.replace('_', ' ') || '—'}</p>
                  <p className="text-xs text-gray-400">{r.id_number}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.country || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3"><Badge value={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelected(r)} title="Review"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Eye size={14} />
                    </button>
                    {r.status === 'pending' || r.status === 'under_review' ? (
                      <>
                        <button onClick={() => review(r.id, 'approve')} title="Approve"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600">
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => {
                          const reason = prompt('Rejection reason (required):')
                          if (reason?.trim()) review(r.id, 'reject', reason)
                        }} title="Reject"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <XCircle size={14} />
                        </button>
                      </>
                    ) : null}
                  </div>
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

      {selected && (
        <KYCDetailModal
          submission={selected}
          onClose={() => setSelected(null)}
          onReview={(action, reason) => review(selected.id, action, reason)}
        />
      )}
    </div>
  )
}

function KYCDetailModal({ submission: s, onClose, onReview }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject,   setShowReject]   = useState(false)
  const canReview = s.status === 'pending' || s.status === 'under_review'

  return (
    <Modal title="KYC Submission" onClose={onClose} wide>
      <div className="space-y-4">
        {/* Personal info */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <KField label="Full name"     value={s.full_name} />
            <KField label="Date of birth" value={s.date_of_birth} />
            <KField label="Nationality"   value={s.nationality} />
            <KField label="Phone"         value={s.user_phone} />
            <KField label="Address"       value={s.address} />
            <KField label="City / Country" value={`${s.city}, ${s.country}`} />
          </div>
        </section>

        {/* Document info */}
        <section className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Document</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <KField label="Type"    value={s.id_type?.replace('_', ' ')} />
            <KField label="Number"  value={s.id_number} />
            <KField label="Expiry"  value={s.id_expiry} />
            <KField label="Status"  value={<Badge value={s.status} />} />
          </div>
          {s.rejection_reason && (
            <div className="mt-3 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700">
              Rejection reason: {s.rejection_reason}
            </div>
          )}
        </section>

        {/* Document images */}
        <section className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</p>
          <div className="grid grid-cols-3 gap-3">
            {[['ID Front', s.id_front_url], ['ID Back', s.id_back_url], ['Selfie', s.selfie_url]].map(([label, src]) => (
              <div key={label} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {src ? (
                  <a href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={label} className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                  </a>
                ) : (
                  <div className="w-full h-28 flex items-center justify-center text-gray-300 text-xs">
                    Not provided
                  </div>
                )}
                <p className="text-center text-[10px] text-gray-400 py-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        {canReview && (
          <div className="border-t border-gray-100 pt-4">
            {showReject ? (
              <div className="space-y-2">
                <textarea
                  className="input-field resize-none h-20 text-sm"
                  placeholder="Rejection reason (required)…"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setShowReject(false)}>Cancel</button>
                  <button className="btn-danger flex-1"
                    onClick={() => rejectReason.trim() && onReview('reject', rejectReason)}
                    disabled={!rejectReason.trim()}>
                    Confirm Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button className="btn-danger flex-1" onClick={() => setShowReject(true)}>Reject</button>
                <button className="btn-primary flex-1" style={{ background: '#16a34a' }}
                  onClick={() => onReview('approve', null)}>
                  Approve KYC
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function KField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 capitalize">{value || '—'}</p>
    </div>
  )
}

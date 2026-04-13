const STYLES = {
  // KYC / status
  verified:     'bg-green-100 text-green-700',
  approved:     'bg-green-100 text-green-700',
  active:       'bg-green-100 text-green-700',
  completed:    'bg-green-100 text-green-700',
  pending:      'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  rejected:     'bg-red-100 text-red-700',
  failed:       'bg-red-100 text-red-700',
  inactive:     'bg-gray-100 text-gray-600',
  frozen:       'bg-blue-100 text-blue-700',
  suspended:    'bg-red-100 text-red-700',
  // user type
  sender:       'bg-indigo-100 text-indigo-700',
  receiver:     'bg-purple-100 text-purple-700',
  // tx type
  remittance:   'bg-indigo-100 text-indigo-700',
  send:         'bg-blue-100 text-blue-700',
  cash_pickup:  'bg-amber-100 text-amber-700',
  wave_transfer:'bg-cyan-100 text-cyan-700',
  top_up:       'bg-emerald-100 text-emerald-700',
  cash_in:      'bg-teal-100 text-teal-700',
  cash_out:     'bg-orange-100 text-orange-700',
}

export default function Badge({ value }) {
  const label = String(value ?? '').replace(/_/g, ' ')
  const cls   = STYLES[value] ?? 'bg-gray-100 text-gray-600'
  return <span className={`badge ${cls}`}>{label}</span>
}

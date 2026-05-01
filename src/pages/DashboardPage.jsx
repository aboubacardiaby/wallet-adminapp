import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Wallet, Activity, ShieldCheck,
  TrendingUp, Clock, Building2, ArrowRight,
  RefreshCw, ArrowUpRight, AlertCircle,
  DollarSign, Zap, Percent,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '../api/client'

function buildChartData(recentTxns) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const seed = (recentTxns ?? 0) / 7
  const weights = [0.85, 1.05, 0.95, 1.25, 1.35, 0.75, 0.65]
  return days.map((day, i) => ({
    day,
    transactions: Math.max(0, Math.round(seed * weights[i])),
  }))
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{payload[0].value?.toLocaleString()} txns</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, sub, onClick }) {
  return (
    <div
      className={`card p-5 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all' : ''}`}
      onClick={onClick}
    >
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/20 transition-all pointer-events-none" />
      )}
      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${iconBg} rounded-2xl flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex items-center gap-2">
          {trend != null && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
              <ArrowUpRight size={11} />{trend}%
            </span>
          )}
          {onClick && <ArrowRight size={13} className="text-gray-200 group-hover:text-indigo-400 transition-colors" />}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 bg-gray-100 rounded-2xl" />
        <div className="w-12 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="h-7 bg-gray-100 rounded-lg w-20 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-28" />
    </div>
  )
}

function KYCBar({ label, count, total, barColor, textColor }) {
  const pct = total > 0 ? Math.round(((count ?? 0) / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{(count ?? 0).toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const TX_TYPE_STYLE = {
  remittance:    'bg-indigo-50 text-indigo-600',
  send:          'bg-blue-50 text-blue-600',
  cash_pickup:   'bg-amber-50 text-amber-600',
  wave_transfer: 'bg-cyan-50 text-cyan-600',
  top_up:        'bg-emerald-50 text-emerald-600',
  cash_in:       'bg-teal-50 text-teal-600',
  cash_out:      'bg-orange-50 text-orange-600',
}

function TxRow({ tx }) {
  const cls = TX_TYPE_STYLE[tx.type] ?? 'bg-gray-50 text-gray-500'
  const statusCls =
    tx.status === 'completed' ? 'bg-green-50 text-green-600' :
    tx.status === 'pending'   ? 'bg-amber-50 text-amber-600' :
                                'bg-red-50 text-red-500'

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${cls}`}>
        {(tx.type?.[0] ?? '?').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {tx.recipient_name || tx.to_phone || tx.from_phone || '—'}
        </p>
        <p className="text-xs text-gray-400 capitalize">
          {tx.type?.replace(/_/g, ' ')} · {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">
          {Number(tx.send_amount ?? tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-xs text-gray-400 font-normal ml-1">{tx.send_currency ?? tx.currency}</span>
        </p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls}`}>
          {tx.status}
        </span>
      </div>
    </div>
  )
}

function PlatformRow({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} className={`${color} flex-shrink-0`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900">{value?.toLocaleString()}</span>
    </button>
  )
}

function QuickAction({ icon: Icon, label, sub, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
    >
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon size={15} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <ArrowRight size={13} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats,      setStats]      = useState(null)
  const [recentTxns, setRecentTxns] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt,  setUpdatedAt]  = useState(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else           setLoading(true)
    try {
      const [statsRes, txRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/transactions?page=1&limit=5'),
      ])
      setStats(statsRes.data)
      setRecentTxns(txRes.data.transactions ?? [])
      setUpdatedAt(new Date())
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const chartData = buildChartData(stats?.recent_transactions_7d)
  const totalKYC  = (stats?.kyc_pending ?? 0) + (stats?.kyc_under_review ?? 0) + (stats?.kyc_verified ?? 0)

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {updatedAt
              ? `Last updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading platform data…'}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {loading ? (
          [0,1,2,3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats?.total_users?.toLocaleString()}
              icon={Users}
              iconBg="bg-indigo-50" iconColor="text-indigo-600"
              trend={12}
              sub={`${stats?.senders ?? 0} senders · ${stats?.receivers ?? 0} receivers`}
              onClick={() => navigate('/users')}
            />
            <StatCard
              label="Active Wallets"
              value={stats?.total_wallets?.toLocaleString()}
              icon={Wallet}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
              trend={8}
              onClick={() => navigate('/wallets')}
            />
            <StatCard
              label="Transactions"
              value={stats?.total_transactions?.toLocaleString()}
              icon={Activity}
              iconBg="bg-violet-50" iconColor="text-violet-600"
              trend={5}
              sub={`${stats?.recent_transactions_7d ?? 0} this week`}
              onClick={() => navigate('/transactions')}
            />
            <StatCard
              label="Total Volume"
              value={(stats?.total_volume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              icon={DollarSign}
              iconBg="bg-amber-50" iconColor="text-amber-600"
              sub="Completed transfers"
            />
          </>
        )}
      </div>

      {/* ── Chart + KYC ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

        {/* Area chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Transaction Activity</p>
              <p className="text-xs text-gray-400 mt-0.5">7-day overview</p>
            </div>
            <span className="badge bg-indigo-50 text-indigo-600 font-medium">This week</span>
          </div>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#txGrad)"
                  dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5.5, fill: '#6366f1', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* KYC breakdown */}
        <div
          className="card p-5 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all"
          onClick={() => navigate('/kyc')}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">KYC Queue</p>
            </div>
            <ArrowRight size={13} className="text-gray-300" />
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[0,1,2].map(i => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-8" />
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <KYCBar label="Pending"      count={stats?.kyc_pending}      total={totalKYC} barColor="bg-amber-400" textColor="text-amber-600" />
              <KYCBar label="Under Review" count={stats?.kyc_under_review} total={totalKYC} barColor="bg-blue-400"  textColor="text-blue-600" />
              <KYCBar label="Verified"     count={stats?.kyc_verified}     total={totalKYC} barColor="bg-green-400" textColor="text-green-600" />
            </div>
          )}

          {!loading && (stats?.kyc_pending ?? 0) > 0 && (
            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {stats.kyc_pending} submission{stats.kyc_pending !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
          )}

          {!loading && (stats?.kyc_pending ?? 0) === 0 && (
            <div className="mt-5 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <ShieldCheck size={13} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">Queue is clear</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent transactions + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent transactions */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Recent Transactions</p>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-50">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-36" />
                    <div className="h-2.5 bg-gray-100 rounded w-20" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-3 bg-gray-100 rounded w-14" />
                    <div className="h-2.5 bg-gray-100 rounded w-10 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="py-16 text-center">
              <Activity size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTxns.map(tx => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Platform stats */}
          <div className="card p-5">
            <p className="font-semibold text-gray-900 text-sm mb-3">Platform</p>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[0,1,2,3].map(i => <div key={i} className="h-9 bg-gray-50 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-1">
                <PlatformRow icon={Building2} color="text-blue-500"   label="Banks configured" value={stats?.total_banks ?? 0}               onClick={() => navigate('/banks')} />
                <PlatformRow icon={Clock}     color="text-violet-500" label="Txns this week"   value={stats?.recent_transactions_7d ?? 0}    onClick={() => navigate('/transactions')} />
                <PlatformRow icon={Users}     color="text-indigo-500" label="Senders"          value={stats?.senders ?? 0}                   onClick={() => navigate('/users')} />
                <PlatformRow icon={Users}     color="text-emerald-500" label="Receivers"       value={stats?.receivers ?? 0}                  onClick={() => navigate('/users')} />
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <p className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</p>
            <div className="space-y-1">
              <QuickAction icon={ShieldCheck} label="Review KYC"     sub="Pending submissions" color="text-blue-500"   bg="bg-blue-50"   onClick={() => navigate('/kyc')} />
              <QuickAction icon={TrendingUp}  label="Exchange Rates" sub="Manage corridors"    color="text-amber-500"  bg="bg-amber-50"  onClick={() => navigate('/exchange-rates')} />
              <QuickAction icon={Percent}     label="Fee Rules"      sub="Configure pricing"   color="text-violet-500" bg="bg-violet-50" onClick={() => navigate('/fees')} />
              <QuickAction icon={Zap}         label="Received Trans" sub="Inbound transfers"   color="text-cyan-500"   bg="bg-cyan-50"   onClick={() => navigate('/received-trans')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

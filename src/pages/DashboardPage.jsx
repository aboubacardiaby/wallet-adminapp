import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Wallet, Activity, ShieldCheck,
  TrendingUp, Clock, Building2, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '../api/client'
import Spinner from '../components/Spinner'

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub, onClick }) {
  return (
    <div
      className={`card p-5 ${onClick ? 'cursor-pointer hover:border-indigo-200 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        {onClick && <ArrowRight size={14} className="text-gray-300 mt-1" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// Simulated 7-day chart data
function buildChartData(recentTxns) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((d, i) => ({
    day: d,
    transactions: Math.round((recentTxns / 7) * (0.6 + Math.random() * 0.8)),
  }))
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  const chartData = buildChartData(stats?.recent_transactions_7d ?? 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users"    value={stats?.total_users?.toLocaleString()}
          icon={Users}       iconBg="bg-indigo-50" iconColor="text-indigo-600"
          sub={`${stats?.senders ?? 0} senders · ${stats?.receivers ?? 0} receivers`}
          onClick={() => navigate('/users')} />
        <StatCard label="Total Wallets"  value={stats?.total_wallets?.toLocaleString()}
          icon={Wallet}      iconBg="bg-green-50"  iconColor="text-green-600"
          onClick={() => navigate('/wallets')} />
        <StatCard label="Transactions"   value={stats?.total_transactions?.toLocaleString()}
          icon={Activity}    iconBg="bg-purple-50" iconColor="text-purple-600"
          sub={`${stats?.recent_transactions_7d ?? 0} in last 7 days`}
          onClick={() => navigate('/transactions')} />
        <StatCard label="Total Volume"
          value={`${(stats?.total_volume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}  iconBg="bg-amber-50"  iconColor="text-amber-600"
          sub="Completed transfers" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* KYC summary */}
        <div className="card p-5 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => navigate('/kyc')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">KYC Status</p>
            </div>
            <ArrowRight size={14} className="text-gray-300" />
          </div>
          <div className="space-y-2.5">
            <KYCRow label="Pending"      count={stats?.kyc_pending}       color="bg-yellow-400" />
            <KYCRow label="Under Review" count={stats?.kyc_under_review}  color="bg-blue-400" />
            <KYCRow label="Verified"     count={stats?.kyc_verified}      color="bg-green-400" />
          </div>
        </div>

        {/* More stats */}
        <div className="card p-5">
          <p className="font-semibold text-gray-800 text-sm mb-4">Platform</p>
          <div className="space-y-3">
            <InfoRow label="Banks configured" value={stats?.total_banks ?? 0}
              icon={<Building2 size={14} className="text-gray-400" />} />
            <InfoRow label="Recent txns (7d)" value={stats?.recent_transactions_7d ?? 0}
              icon={<Clock size={14} className="text-gray-400" />} />
            <InfoRow label="Senders" value={stats?.senders ?? 0}
              icon={<Users size={14} className="text-gray-400" />} />
            <InfoRow label="Receivers" value={stats?.receivers ?? 0}
              icon={<Users size={14} className="text-gray-400" />} />
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <p className="font-semibold text-gray-800 text-sm mb-4">Transactions · 7 days</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KYCRow({ label, count, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900">{count ?? 0}</span>
    </div>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-gray-900">{value?.toLocaleString()}</span>
    </div>
  )
}

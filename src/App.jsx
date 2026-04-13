import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import UsersPage       from './pages/UsersPage'
import KYCPage         from './pages/KYCPage'
import WalletsPage     from './pages/WalletsPage'
import BanksPage       from './pages/BanksPage'
import TransactionsPage  from './pages/TransactionsPage'
import ExchangeRatesPage from './pages/ExchangeRatesPage'
import FeesPage          from './pages/FeesPage'
import SettingsPage      from './pages/SettingsPage'

function AdminLayout() {
  const { isAuth } = useAuth()
  if (!isAuth) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}

function PublicRoute() {
  const { isAuth } = useAuth()
  if (isAuth) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route index            element={<DashboardPage />} />
          <Route path="users"        element={<UsersPage />} />
          <Route path="kyc"          element={<KYCPage />} />
          <Route path="wallets"      element={<WalletsPage />} />
          <Route path="banks"        element={<BanksPage />} />
          <Route path="transactions"   element={<TransactionsPage />} />
          <Route path="exchange-rates" element={<ExchangeRatesPage />} />
          <Route path="fees"           element={<FeesPage />} />
          <Route path="settings"       element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { canAccess } from './lib/roles'
import Sidebar from './components/Sidebar'
import LoginPage        from './pages/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import UsersPage        from './pages/UsersPage'
import KYCPage          from './pages/KYCPage'
import WalletsPage      from './pages/WalletsPage'
import BanksPage        from './pages/BanksPage'
import TransactionsPage from './pages/TransactionsPage'
import ExchangeRatesPage from './pages/ExchangeRatesPage'
import FeesPage         from './pages/FeesPage'
import SettingsPage     from './pages/SettingsPage'
import ReceivedTransPage from './pages/ReceivedTransPage'
import AgentsPage       from './pages/AgentsPage'
import AdminUsersPage   from './pages/AdminUsersPage'
import AchConfigPage    from './pages/AchConfigPage'

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

// Redirects to "/" if the user's role can't access this route
function RoleRoute({ path }) {
  const { role } = useAuth()
  if (!canAccess(role, path)) return <Navigate to="/" replace />
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
          {/* Available to all authenticated roles */}
          <Route index element={<DashboardPage />} />

          <Route element={<RoleRoute path="/users" />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route element={<RoleRoute path="/kyc" />}>
            <Route path="kyc" element={<KYCPage />} />
          </Route>
          <Route element={<RoleRoute path="/wallets" />}>
            <Route path="wallets" element={<WalletsPage />} />
          </Route>
          <Route element={<RoleRoute path="/banks" />}>
            <Route path="banks" element={<BanksPage />} />
          </Route>
          <Route element={<RoleRoute path="/transactions" />}>
            <Route path="transactions" element={<TransactionsPage />} />
          </Route>
          <Route element={<RoleRoute path="/agents" />}>
            <Route path="agents" element={<AgentsPage />} />
          </Route>
          <Route element={<RoleRoute path="/exchange-rates" />}>
            <Route path="exchange-rates" element={<ExchangeRatesPage />} />
          </Route>
          <Route element={<RoleRoute path="/fees" />}>
            <Route path="fees" element={<FeesPage />} />
          </Route>
          <Route element={<RoleRoute path="/received-trans" />}>
            <Route path="received-trans" element={<ReceivedTransPage />} />
          </Route>
          <Route element={<RoleRoute path="/settings" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RoleRoute path="/admin-users" />}>
            <Route path="admin-users" element={<AdminUsersPage />} />
          </Route>
          <Route element={<RoleRoute path="/ach-config" />}>
            <Route path="ach-config" element={<AchConfigPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Wallet,
  Building2, Settings, LogOut, Activity, ChevronsRight,
  TrendingUp, Percent,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/users',          icon: Users,           label: 'Users'          },
  { to: '/kyc',            icon: ShieldCheck,     label: 'KYC Review'    },
  { to: '/wallets',        icon: Wallet,          label: 'Wallets'        },
  { to: '/banks',          icon: Building2,       label: 'Banks'          },
  { to: '/transactions',   icon: Activity,        label: 'Transactions'   },
  { to: '/exchange-rates', icon: TrendingUp,      label: 'Exchange Rates' },
  { to: '/fees',           icon: Percent,         label: 'Fee Rules'      },
  { to: '/settings',       icon: Settings,        label: 'Settings'       },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <ChevronsRight size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Kalipeh</p>
          <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Wallet,
  Building2, Settings, LogOut, Activity, ChevronsRight,
  TrendingUp, Percent, ArrowDownToLine, Store, UserCog, Landmark, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canAccess, ROLE_LABELS, ROLE_COLORS } from '../lib/roles'

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/users',          icon: Users,           label: 'Users'          },
  { to: '/kyc',            icon: ShieldCheck,     label: 'KYC Review'    },
  { to: '/wallets',        icon: Wallet,          label: 'Wallets'        },
  { to: '/banks',          icon: Building2,       label: 'Banks'          },
  { to: '/transactions',   icon: Activity,        label: 'Transactions'   },
  { to: '/agents',         icon: Store,           label: 'Agents'         },
  { to: '/exchange-rates', icon: TrendingUp,      label: 'Exchange Rates' },
  { to: '/fees',           icon: Percent,         label: 'Fee Rules'      },
  { to: '/received-trans', icon: ArrowDownToLine, label: 'Received Trans'  },
  { to: '/settings',       icon: Settings,        label: 'Settings'       },
  { to: '/ach-config',     icon: Landmark,        label: 'ACH Config'     },
  { to: '/admin-users',    icon: UserCog,         label: 'Admin Users'    },
]

export default function Sidebar({ open, onClose }) {
  const { logout, role, username } = useAuth()
  const navigate = useNavigate()

  const visibleNav = NAV.filter(item => canAccess(role, item.to))

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-gray-900 flex flex-col z-30
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:w-60
      `}>
        {/* Logo + mobile close button */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChevronsRight size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Kalipeh</p>
              <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
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

        {/* Current user + sign out */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2.5 px-3">
            <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {(username || 'A')[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{username || 'Admin'}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-gray-700 text-gray-300'}`}>
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export const ROLE_LABELS = {
  super_admin:      'Super Admin',
  manager:          'Manager',
  compliance:       'Compliance',
  agent_supervisor: 'Agent Supervisor',
  viewer:           'Viewer',
}

export const ROLE_COLORS = {
  super_admin:      'bg-purple-100 text-purple-700',
  manager:          'bg-blue-100 text-blue-700',
  compliance:       'bg-green-100 text-green-700',
  agent_supervisor: 'bg-amber-100 text-amber-700',
  viewer:           'bg-gray-100 text-gray-600',
}

// Routes each role can access
export const ROLE_ROUTES = {
  super_admin:      ['/', '/users', '/kyc', '/wallets', '/banks', '/transactions', '/agents', '/exchange-rates', '/fees', '/received-trans', '/settings', '/ach-config', '/admin-users'],
  manager:          ['/', '/users', '/kyc', '/wallets', '/banks', '/transactions', '/agents', '/received-trans'],
  compliance:       ['/', '/users', '/kyc', '/transactions', '/received-trans'],
  agent_supervisor: ['/', '/transactions', '/agents', '/received-trans'],
  viewer:           ['/', '/users', '/kyc', '/wallets', '/banks', '/transactions', '/agents', '/exchange-rates', '/fees', '/received-trans'],
}

export function canAccess(role, path) {
  const allowed = ROLE_ROUTES[role] ?? ROLE_ROUTES['viewer']
  return allowed.includes(path)
}

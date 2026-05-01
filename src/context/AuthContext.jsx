import { createContext, useContext, useState } from 'react'

const AuthCtx = createContext(null)

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(() => localStorage.getItem('admin_token'))
  const [username, setUsername] = useState(() => localStorage.getItem('admin_username') || '')
  const [role,     setRole]     = useState(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) return ''
    return decodeJwt(t).role || 'super_admin'
  })

  const login = (accessToken, user, userRole) => {
    localStorage.setItem('admin_token', accessToken)
    localStorage.setItem('admin_username', user || '')
    setToken(accessToken)
    setUsername(user || '')
    // If role not passed explicitly, decode from token
    const r = userRole || decodeJwt(accessToken).role || 'super_admin'
    setRole(r)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    setToken(null)
    setUsername('')
    setRole('')
  }

  return (
    <AuthCtx.Provider value={{ token, login, logout, isAuth: !!token, role, username }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

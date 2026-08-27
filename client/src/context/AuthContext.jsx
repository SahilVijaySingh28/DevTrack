import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AuthContext } from './auth-context'

const tokenKey = 'devtrack_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(tokenKey)))

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) return
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setLoading(false))
  }, [])

  const authenticate = (data) => {
    localStorage.setItem(tokenKey, data.token)
    setUser(data.user)
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    authenticate(data)
  }

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details)
    authenticate(data)
  }

  const logout = () => {
    localStorage.removeItem(tokenKey)
    setUser(null)
  }

  const updateUser = (updatedUser) => setUser(updatedUser)

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
}


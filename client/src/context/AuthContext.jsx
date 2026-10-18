import { useEffect, useState } from 'react'
import api from '../api/axios'
import socket from '../api/socket'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const userId = user?._id || user?.id

  useEffect(() => {
    localStorage.removeItem('devtrack_token')
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (userId) {
      socket.connect()
      return () => socket.disconnect()
    }

    socket.disconnect()
  }, [userId])

  const authenticate = (data) => {
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

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  const updateUser = (updatedUser) => setUser(updatedUser)

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
}


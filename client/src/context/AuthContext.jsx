import { useEffect, useState } from 'react'
import api, { refreshSession } from '../api/axios'
import socket from '../api/socket'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const userId = user?._id || user?.id

  useEffect(() => {
    const controller = new AbortController()
    localStorage.removeItem('devtrack_token')
    api.get('/auth/me', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setUser(data.user)
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (userId) {
      let active = true
      let refreshingSocket = false
      const refreshSocket = async () => {
        if (refreshingSocket) return
        refreshingSocket = true
        try {
          await refreshSession()
          if (active) {
            socket.disconnect()
            socket.connect()
          }
        } catch {
          if (active) setUser(null)
        } finally {
          refreshingSocket = false
        }
      }
      const handleConnectError = (error) => {
        if (error.data?.code === 'ACCESS_TOKEN_EXPIRED') void refreshSocket()
      }

      socket.on('connect_error', handleConnectError)
      socket.on('access_token_expired', refreshSocket)
      socket.connect()
      return () => {
        active = false
        socket.off('connect_error', handleConnectError)
        socket.off('access_token_expired', refreshSocket)
        socket.disconnect()
      }
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


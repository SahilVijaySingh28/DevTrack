import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

let refreshPromise

const refreshWithBrowserLock = () => {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return api.post('/auth/refresh')
  }
  return navigator.locks.request('devtrack-auth-refresh', () => api.post('/auth/refresh'))
}

export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = refreshWithBrowserLock().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh', '/auth/me']
      .some((path) => config?.url?.includes(path))

    if (error.response?.status !== 401 || !config || config._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    config._retry = true
    try {
      await refreshSession()
      return await api.request(config)
    } catch (refreshError) {
      window.location.href = '/'
      return Promise.reject(refreshError)
    }
  }
)

export default api

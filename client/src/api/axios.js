import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devtrack_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/login') ||
                          error.config?.url?.includes('/auth/register')
      if (!isAuthRoute) {
        localStorage.removeItem('devtrack_token')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api

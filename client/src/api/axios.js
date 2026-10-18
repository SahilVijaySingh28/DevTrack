import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Auto-logout on 401 (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/login') ||
                          error.config?.url?.includes('/auth/register') ||
                          error.config?.url?.includes('/auth/logout') ||
                          error.config?.url?.includes('/auth/me')
      if (!isAuthRoute) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading DevTrack...</div>
  return user ? <Outlet /> : <Navigate to="/" replace />
}

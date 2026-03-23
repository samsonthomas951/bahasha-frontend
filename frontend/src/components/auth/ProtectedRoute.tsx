import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { isSuperAdmin } from '@/types/auth'

/** Any authenticated user */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

/** Tier 1 only — super_admin. Others are redirected to /dashboard. */
export function SuperAdminRoute() {
  const user = useAuthStore((s) => s.user)

  if (!isSuperAdmin(user)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

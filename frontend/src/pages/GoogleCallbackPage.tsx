import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyToken } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export default function GoogleCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const error = params.get('error')
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    const token = params.get('token')
    const expiresAt = params.get('expires_at')

    if (token && expiresAt) {
      // Backend passed a Bearer token directly — store it and fetch the user profile.
      verifyToken(token)
        .then(({ user }) => {
          setAuth(token, user, expiresAt)
          navigate('/dashboard', { replace: true })
        })
        .catch(() => navigate('/login?error=google_auth_failed', { replace: true }))
      return
    }

    navigate('/login?error=google_auth_failed', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  )
}

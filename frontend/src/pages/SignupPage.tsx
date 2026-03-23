import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuthStore } from '@/stores/authStore'

export default function SignupPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Bahasha</h1>
          <p className="text-sm text-muted-foreground">Create your church admin account</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}

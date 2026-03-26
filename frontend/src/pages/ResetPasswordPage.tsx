import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/api/auth'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-8 shadow-sm text-center">
          <p className="text-destructive text-sm">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline text-sm">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      navigate('/login?reset=1', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed. The link may have expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

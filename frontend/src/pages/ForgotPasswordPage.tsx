import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await forgotPassword(email.trim())
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center text-sm">
            <p className="text-muted-foreground">
              If that email is registered, a reset link has been sent. Check your inbox — the link
              expires in <strong>30 minutes</strong>.
            </p>
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

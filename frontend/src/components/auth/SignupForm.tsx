import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register, login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { GoogleButton } from './GoogleButton'

export function SignupForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const signupMutation = useMutation({
    mutationFn: async (payload: { username: string; email: string; password: string }) => {
      await register(payload)
      // Auto-login immediately after registration
      return login({ username: payload.username, password: payload.password })
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.expires_at ?? null)
      navigate('/churches/new', { replace: true })
    },
  })

  const mismatch = confirm.length > 0 && password !== confirm

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (password !== confirm) return
    signupMutation.mutate({ username, email, password })
  }

  const errorMsg =
    signupMutation.error instanceof Error
      ? signupMutation.error.message
      : signupMutation.isError
        ? 'Registration failed. Please try again.'
        : null

  return (
    <div className="space-y-4">
      <GoogleButton label="Sign up with Google" />

      <div className="relative flex items-center">
        <span className="flex-1 border-t" />
        <span className="mx-3 text-xs text-muted-foreground">or</span>
        <span className="flex-1 border-t" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={signupMutation.isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={signupMutation.isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={signupMutation.isPending}
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
            disabled={signupMutation.isPending}
            aria-invalid={mismatch}
          />
          {mismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>
        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
        <Button type="submit" className="w-full" disabled={signupMutation.isPending || mismatch}>
          {signupMutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

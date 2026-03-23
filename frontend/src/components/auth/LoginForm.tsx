import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { GoogleButton } from './GoogleButton'

export function LoginForm() {
  const { loginMutation } = useAuth()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const oauthError = params.get('error')

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    loginMutation.mutate({ username, password })
  }

  const errorMsg =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : loginMutation.isError
        ? 'Login failed. Check your credentials.'
        : null

  return (
    <div className="space-y-4">
      <GoogleButton label="Sign in with Google" />

      <div className="relative flex items-center">
        <span className="flex-1 border-t" />
        <span className="mx-3 text-xs text-muted-foreground">or</span>
        <span className="flex-1 border-t" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="username">Username or Email</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loginMutation.isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loginMutation.isPending}
          />
        </div>
        {(errorMsg || oauthError) && (
          <p className="text-sm text-destructive">
            {errorMsg ?? decodeURIComponent(oauthError!)}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

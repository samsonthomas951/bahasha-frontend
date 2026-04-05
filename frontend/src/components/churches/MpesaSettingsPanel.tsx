import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMpesaCredentials, submitMpesaCredentials } from '@/api/churches'
import type { SubmitMpesaCredentialsPayload } from '@/types/church'

const SANDBOX_SHORTCODE = '174379'

const schema = z.object({
  consumer_key:    z.string().min(1, 'Consumer key is required'),
  consumer_secret: z.string().min(1, 'Consumer secret is required'),
  passkey:         z.string(),
  shortcode:       z.string(),
  environment:     z.enum(['sandbox', 'production']),
}).superRefine((data, ctx) => {
  if (data.environment === 'production') {
    if (!data.passkey.trim())
      ctx.addIssue({ code: 'custom', path: ['passkey'], message: 'Passkey is required' })
    if (!data.shortcode.trim())
      ctx.addIssue({ code: 'custom', path: ['shortcode'], message: 'Shortcode is required' })
  }
})

type FormValues = z.infer<typeof schema>

interface Props {
  churchId: number
}

export function MpesaSettingsPanel({ churchId }: Props) {
  const qc = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)
  const [showPasskey, setShowPasskey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const credQuery = useQuery({
    queryKey: ['churches', churchId, 'mpesa-credentials'],
    queryFn:  () => getMpesaCredentials(churchId),
  })

  const cred = credQuery.data

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      consumer_key:    '',
      consumer_secret: '',
      passkey:         '',
      shortcode:       cred?.shortcode ?? SANDBOX_SHORTCODE,
      environment:     cred?.environment ?? 'sandbox',
    },
  })

  const environment = watch('environment')

  const saveMutation = useMutation({
    mutationFn: (payload: SubmitMpesaCredentialsPayload) =>
      submitMpesaCredentials(churchId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches', churchId, 'mpesa-credentials'] })
      setApiError(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    },
    onError: (err: { response?: { data?: { error?: string; detail?: string } } }) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to save credentials. Please try again.'
      setApiError(msg)
      setSuccess(false)
    },
  })

  const onSubmit = (values: FormValues) => {
    setApiError(null)
    setSuccess(false)
    saveMutation.mutate(values)
  }

  if (credQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading M-Pesa settings…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current status card */}
      {cred?.configured ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current configuration</span>
            {cred.is_valid ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
                <CheckCircle2 className="h-3 w-3" />
                Validated
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
                <XCircle className="h-3 w-3" />
                Invalid
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Shortcode</span>
              <p className="font-mono font-medium mt-0.5">{cred.shortcode}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Environment</span>
              <p className="capitalize font-medium mt-0.5">{cred.environment}</p>
            </div>
            {cred.validated_at && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Last validated</span>
                <p className="mt-0.5">{new Date(cred.validated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No M-Pesa credentials configured yet. Fill in the form below to connect your Daraja account.
        </div>
      )}

      {/* Credential form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm font-medium">
          {cred?.configured ? 'Update credentials' : 'Add credentials'}
        </p>

        {/* Shortcode + Environment row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shortcode">Shortcode</Label>
            <Input
              id="shortcode"
              placeholder="e.g. 174379"
              disabled={environment === 'sandbox'}
              {...register('shortcode')}
            />
            {errors.shortcode && (
              <p className="text-xs text-destructive">{errors.shortcode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="environment">Environment</Label>
            <Select
              value={environment}
              onValueChange={(v) => {
                const env = v as 'sandbox' | 'production'
                setValue('environment', env)
                if (env === 'sandbox') {
                  setValue('shortcode', SANDBOX_SHORTCODE)
                  setValue('passkey', '')
                }
              }}
            >
              <SelectTrigger id="environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Consumer Key */}
        <div className="space-y-1.5">
          <Label htmlFor="consumer_key">Consumer Key</Label>
          <div className="relative">
            <Input
              id="consumer_key"
              type={showKey ? 'text' : 'password'}
              placeholder="Daraja consumer key"
              className="pr-10"
              {...register('consumer_key')}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.consumer_key && (
            <p className="text-xs text-destructive">{errors.consumer_key.message}</p>
          )}
        </div>

        {/* Consumer Secret */}
        <div className="space-y-1.5">
          <Label htmlFor="consumer_secret">Consumer Secret</Label>
          <div className="relative">
            <Input
              id="consumer_secret"
              type={showSecret ? 'text' : 'password'}
              placeholder="Daraja consumer secret"
              className="pr-10"
              {...register('consumer_secret')}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.consumer_secret && (
            <p className="text-xs text-destructive">{errors.consumer_secret.message}</p>
          )}
        </div>

        {/* Passkey — production only */}
        {environment === 'production' && (
          <div className="space-y-1.5">
            <Label htmlFor="passkey">Passkey</Label>
            <div className="relative">
              <Input
                id="passkey"
                type={showPasskey ? 'text' : 'password'}
                placeholder="Lipa Na M-Pesa passkey"
                className="pr-10"
                {...register('passkey')}
              />
              <button
                type="button"
                onClick={() => setShowPasskey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.passkey && (
              <p className="text-xs text-destructive">{errors.passkey.message}</p>
            )}
          </div>
        )}

        {/* Feedback */}
        {apiError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            {apiError}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-700 rounded-md border border-green-300 bg-green-50 px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Credentials saved and validated successfully.
          </p>
        )}

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Validating…</>
          ) : cred?.configured ? (
            'Update credentials'
          ) : (
            'Save & validate'
          )}
        </Button>
      </form>
    </div>
  )
}

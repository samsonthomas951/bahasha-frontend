import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChurchPublic {
  id: number
  name: string
  code: string
  logo_url?: string
  primary_color?: string
}

interface DynamicCategory {
  name: string
  amount: number
}

interface ContributionData {
  tithe: number
  offering: number
  localBudget: number
  churchDevelopment: number
  evangelism: number
  dynamicCategories: Record<string, DynamicCategory>
  total: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATIC_FIELDS = [
  { id: 'tithe', label: 'Tithe' },
  { id: 'offering', label: 'Offering' },
  { id: 'localBudget', label: 'Local Church Budget' },
  { id: 'churchDevelopment', label: 'Church Development' },
  { id: 'evangelism', label: 'Evangelism' },
] as const

const EXTRA_OPTIONS = [
  'Children',
  'Youth',
  'AEMR/LCB',
  'Welfare',
  'Camp Meeting - Offering',
  'Camp Meeting - Expenses',
  'Youth Kitty',
  'Choir Kitty',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.min(255, Math.max(0, (num >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function btnStyle(primaryColor?: string) {
  if (!primaryColor) return {}
  return {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 20)} 100%)`,
  }
}

function numericOnly(value: string): string {
  const clean = value.replace(/[^\d.]/g, '')
  const parts = clean.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : clean
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChurchHeader({ church }: { church: ChurchPublic }) {
  return (
    <div className="flex flex-col items-center pb-4 pt-6">
      {church.logo_url && (
        <img
          src={church.logo_url}
          alt={`${church.name} logo`}
          className="mb-3 h-20 w-auto max-w-[180px] object-contain"
        />
      )}
      <h1 className="text-lg font-semibold text-center" style={{ color: church.primary_color ?? '#2d5a2d' }}>
        {church.name}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{church.name} WhatsApp Envelope</p>
    </div>
  )
}

// ─── Step 1 – Contributions ───────────────────────────────────────────────────

interface Step1Props {
  church: ChurchPublic
  onNext: (data: ContributionData) => void
}

function Step1({ church, onNext }: Step1Props) {
  const [values, setValues] = useState({ tithe: '', offering: '', localBudget: '', churchDevelopment: '', evangelism: '' })
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, DynamicCategory>>({})
  const [dynamicInputs, setDynamicInputs] = useState<Array<{ uid: string; name: string; value: string }>>([])
  const counterRef = useRef(0)

  function handleStaticInput(id: keyof typeof values, raw: string) {
    setValues((prev) => ({ ...prev, [id]: numericOnly(raw) }))
  }

  function handleCategorySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value
    if (!name) return
    e.target.value = ''
    counterRef.current += 1
    const uid = `${name}_${counterRef.current}`
    setDynamicInputs((prev) => [...prev, { uid, name, value: '' }])
    setDynamicCategories((prev) => ({ ...prev, [uid]: { name, amount: 0 } }))
  }

  function handleDynamicInput(uid: string, raw: string) {
    const clean = numericOnly(raw)
    setDynamicInputs((prev) => prev.map((d) => (d.uid === uid ? { ...d, value: clean } : d)))
    setDynamicCategories((prev) => ({
      ...prev,
      [uid]: { ...prev[uid], amount: parseFloat(clean) || 0 },
    }))
  }

  function removeCategory(uid: string) {
    setDynamicInputs((prev) => prev.filter((d) => d.uid !== uid))
    setDynamicCategories((prev) => {
      const next = { ...prev }
      delete next[uid]
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tithe = parseFloat(values.tithe) || 0
    const offering = parseFloat(values.offering) || 0
    const localBudget = parseFloat(values.localBudget) || 0
    const churchDevelopment = parseFloat(values.churchDevelopment) || 0
    const evangelism = parseFloat(values.evangelism) || 0

    const dynamicTotal = Object.values(dynamicCategories).reduce((s, c) => s + c.amount, 0)
    const total = tithe + offering + localBudget + churchDevelopment + evangelism + dynamicTotal

    if (total <= 0) {
      alert('Please enter at least one contribution amount')
      return
    }

    onNext({ tithe, offering, localBudget, churchDevelopment, evangelism, dynamicCategories, total })
  }

  const inputCls =
    'w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-4 text-base focus:border-green-600 focus:outline-none transition-colors'
  const selectCls =
    'w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-4 text-base focus:border-green-600 focus:outline-none transition-colors pr-10 bg-[url("data:image/svg+xml,%3csvg%20xmlns%3d%27http%3a%2f%2fwww.w3.org%2f2000%2fsvg%27%20fill%3d%27none%27%20viewBox%3d%270%200%2020%2020%27%3e%3cpath%20stroke%3d%27%236b7280%27%20stroke-linecap%3d%27round%27%20stroke-linejoin%3d%27round%27%20stroke-width%3d%271.5%27%20d%3d%27m6%208%204%204%204-4%27%2f%3e%3c%2fsvg%3e")] bg-[right_12px_center] bg-no-repeat bg-[length:16px]'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ChurchHeader church={church} />

      {STATIC_FIELDS.map(({ id, label }) => (
        <input
          key={id}
          type="text"
          inputMode="numeric"
          placeholder={label}
          value={values[id]}
          onChange={(e) => handleStaticInput(id, e.target.value)}
          className={inputCls}
        />
      ))}

      {dynamicInputs.map(({ uid, name, value }) => (
        <div key={uid} className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder={name}
            value={value}
            onChange={(e) => handleDynamicInput(uid, e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => removeCategory(uid)}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-4 text-white hover:bg-red-600 active:scale-95 transition-all"
          >
            ×
          </button>
        </div>
      ))}

      <select onChange={handleCategorySelect} className={selectCls} defaultValue="">
        <option value="" disabled>
          Add category…
        </option>
        {EXTRA_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="mt-2 rounded-xl py-5 text-base font-semibold text-white transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg"
        style={btnStyle(church.primary_color) || { background: 'linear-gradient(135deg,#4a7c4a,#5a8c5a)' }}
      >
        Next →
      </button>
    </form>
  )
}

// ─── Step 2 – Payment ─────────────────────────────────────────────────────────

interface Step2Props {
  church: ChurchPublic
  data: ContributionData
  onBack: () => void
}

type PayStatus = 'idle' | 'processing' | 'success' | 'error'

function Step2({ church, data, onBack }: Step2Props) {
  const [name, setName] = useState(() => localStorage.getItem('nameStored') ?? '')
  const [memberStatus, setMemberStatus] = useState<'member' | 'visitor'>('member')
  const [phone, setPhone] = useState(() => localStorage.getItem('mpesaNumberStored') ?? '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [message, setMessage] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const staticRows = [
    { label: 'Tithe', amount: data.tithe },
    { label: 'Offering', amount: data.offering },
    { label: 'Local Church Budget', amount: data.localBudget },
    { label: 'Church Development', amount: data.churchDevelopment },
    { label: 'Evangelism', amount: data.evangelism },
  ].filter((r) => r.amount > 0)

  const dynamicRows = Object.values(data.dynamicCategories).filter((c) => c.amount > 0)

  async function checkPaymentStatus(checkoutRequestId: string, giverName: string, amount: number) {
    let attempts = 0
    const maxAttempts = 24

    const check = async () => {
      try {
        attempts++
        const res = await fetch(`/api/v1/mpesa/payment-status/${checkoutRequestId}`)
        const json = await res.json()

        if (json.success && json.data) {
          const { status, mpesaReceiptNumber, resultDesc } = json.data
          if (status === 'completed') {
            clearInterval(intervalRef.current!)
            setPayStatus('success')
            setMessage(
              `Payment of Ksh ${amount.toFixed(2)} received! Thank you ${giverName}. ${mpesaReceiptNumber ? `Receipt: ${mpesaReceiptNumber}` : ''}`,
            )
            return
          }
          if (status === 'failed') {
            clearInterval(intervalRef.current!)
            setPayStatus('error')
            setMessage(`Payment failed: ${resultDesc ?? 'Transaction was cancelled'}`)
            return
          }
        }
        if (attempts >= maxAttempts) {
          clearInterval(intervalRef.current!)
          setPayStatus('error')
          setMessage('Payment status check timed out. Contact support if payment was deducted.')
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(intervalRef.current!)
          setPayStatus('error')
          setMessage('Unable to verify payment status. Please contact support.')
        }
      }
    }

    setTimeout(() => {
      check()
      intervalRef.current = setInterval(check, 5000)
    }, 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^254[0-9]{9}$/.test(phone)) {
      setPayStatus('error')
      setMessage('Please enter a valid phone number starting with 254')
      return
    }

    localStorage.setItem('mpesaNumberStored', phone)
    localStorage.setItem('nameStored', name)

    setPayStatus('processing')
    setMessage('')

    try {
      const res = await fetch('/api/v1/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          amount: data.total,
          name,
          memberStatus,
          churchId: church.id,
          contributionData: data,
          isAnonymous,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage(`STK push sent to ${phone}. Check your phone and enter M-Pesa PIN to pay Ksh ${data.total.toFixed(2)}.`)
        checkPaymentStatus(json.checkoutRequestId, name, data.total)
      } else {
        setPayStatus('error')
        setMessage(`Payment initiation failed: ${json.message}`)
      }
    } catch {
      setPayStatus('error')
      setMessage('Payment initiation failed. Please check your connection.')
    }
  }

  const isProcessing = payStatus === 'processing'

  const inputCls =
    'w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-4 text-base focus:border-green-600 focus:outline-none transition-colors'
  const selectCls =
    'w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-4 text-base focus:border-green-600 focus:outline-none transition-colors pr-10 bg-[url("data:image/svg+xml,%3csvg%20xmlns%3d%27http%3a%2f%2fwww.w3.org%2f2000%2fsvg%27%20fill%3d%27none%27%20viewBox%3d%270%200%2020%2020%27%3e%3cpath%20stroke%3d%27%236b7280%27%20stroke-linecap%3d%27round%27%20stroke-linejoin%3d%27round%27%20stroke-width%3d%271.5%27%20d%3d%27m6%208%204%204%204-4%27%2f%3e%3c%2fsvg%3e")] bg-[right_12px_center] bg-no-repeat bg-[length:16px]'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ChurchHeader church={church} />

      {/* Receipt */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-center text-base font-semibold" style={{ color: church.primary_color ?? '#2d5a2d' }}>
          Receipt Summary
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-lg bg-green-50 px-3 py-2 text-left font-semibold text-green-800">Item</th>
              <th className="rounded-tr-lg bg-green-50 px-3 py-2 text-right font-semibold text-green-800">Amount (Ksh)</th>
            </tr>
          </thead>
          <tbody>
            {staticRows.map((r) => (
              <tr key={r.label} className="border-t border-gray-200">
                <td className="px-3 py-2 text-gray-700">{r.label}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.amount.toFixed(2)}</td>
              </tr>
            ))}
            {dynamicRows.map((r, i) => (
              <tr key={i} className="border-t border-gray-200">
                <td className="px-3 py-2 text-gray-700">{r.name}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300" style={{ background: church.primary_color ?? '#2d5a2d' }}>
              <td className="rounded-bl-lg px-3 py-2 font-bold text-white">Total</td>
              <td className="rounded-br-lg px-3 py-2 text-right text-lg font-bold text-white">{data.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Personal details */}
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={inputCls}
      />

      <select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value as 'member' | 'visitor')} className={selectCls}>
        <option value="member">Church Member</option>
        <option value="visitor">Visitor</option>
      </select>

      <input
        type="tel"
        placeholder="M-Pesa number (254XXXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        pattern="254[0-9]{9}"
        required
        className={inputCls}
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 accent-green-600"
        />
        <span className="text-sm text-gray-600">
          Make my donation anonymous
          <span className="ml-1 text-xs text-gray-400">(name &amp; phone hidden in records)</span>
        </span>
      </label>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm text-center ${
            payStatus === 'success'
              ? 'border border-green-300 bg-green-50 text-green-800'
              : payStatus === 'error'
              ? 'border border-red-300 bg-red-50 text-red-800'
              : 'border border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || payStatus === 'success'}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl py-5 text-base font-semibold text-white transition-all active:scale-95 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        style={btnStyle(church.primary_color) || { background: 'linear-gradient(135deg,#4a7c4a,#5a8c5a)' }}
      >
        {isProcessing && (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isProcessing ? 'Processing…' : payStatus === 'success' ? 'Payment Received ✓' : 'Give'}
      </button>

      {payStatus !== 'processing' && payStatus !== 'success' && (
        <button type="button" onClick={onBack} className="pb-2 text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700">
          ← Back
        </button>
      )}
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DonationFormPage() {
  const { churchCode } = useParams<{ churchCode: string }>()
  const [church, setChurch] = useState<ChurchPublic | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [contributionData, setContributionData] = useState<ContributionData | null>(null)

  useEffect(() => {
    if (!churchCode) {
      setLoadState('error')
      setErrorMsg('No church code provided in URL.')
      return
    }

    fetch(`/api/v1/churches/code/${churchCode}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? 'Church not found')
        }
        return res.json()
      })
      .then((json) => {
        setChurch(json.church)
        setLoadState('ready')
      })
      .catch((err: Error) => {
        setErrorMsg(err.message)
        setLoadState('error')
      })
  }, [churchCode])

  function handleNext(data: ContributionData) {
    setContributionData(data)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-green-950 to-green-800">
        <div className="flex flex-col items-center gap-4 text-white">
          <svg className="h-10 w-10 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm opacity-75">Loading church details…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (loadState === 'error' || !church) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-green-950 to-green-800 p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center text-white">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-2xl font-semibold">Church Not Found</h2>
          <p className="text-sm opacity-75">{errorMsg || `No church found for code "${churchCode}".`}</p>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh bg-gradient-to-br from-green-950 to-green-800 flex items-start justify-center py-6 px-4 md:items-center md:py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="px-5 pb-8">
          {step === 1 ? (
            <Step1 church={church} onNext={handleNext} />
          ) : (
            <Step2 church={church} data={contributionData!} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}

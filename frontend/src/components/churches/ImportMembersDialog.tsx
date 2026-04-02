import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bulkAddChurchMembers } from '@/api/churches'

type Step = 'upload' | 'preview' | 'done'

interface ParsedRow {
  rawPhone: string
  phone: string | null
  name: string
  warning?: string
}

interface ImportResult {
  added: number
  updated: number
  failed: { phone_number: string; error: string }[]
}

/**
 * Normalize Kenyan phone numbers to 254XXXXXXXXX format (no leading +).
 * Handles:
 *   254712345678  → 254712345678   (already correct)
 *   0712345678    → 254712345678   (leading 0)
 *   712345678     → 254712345678   (Excel dropped leading 0, 9-digit Safaricom/Airtel)
 *   0112345678    → 254112345678   (landline with 0)
 *   112345678     → 254112345678   (Excel dropped leading 0, 9-digit landline)
 *   +254712345678 → 254712345678   (with + prefix)
 * Other formats that are 7–15 digits are passed through with a warning.
 */
function normalizePhone(raw: string): { phone: string | null; warning?: string } {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return { phone: null, warning: 'Empty' }

  // 254 + 9 digits = 12 total (correct format)
  if (digits.startsWith('254') && digits.length === 12) return { phone: digits }
  // 0 + 9 digits = 10 total (local format with leading zero)
  if (digits.startsWith('0') && digits.length === 10) return { phone: '254' + digits.slice(1) }
  // 9 digits starting with 7 or 1 (Excel dropped leading zero)
  if (digits.length === 9 && (digits[0] === '7' || digits[0] === '1')) return { phone: '254' + digits }
  // Any other plausible length — pass through with warning
  if (digits.length >= 7 && digits.length <= 15 && digits[0] !== '0')
    return { phone: digits, warning: 'Unusual format — please verify' }

  return { phone: null, warning: `Cannot parse "${raw}"` }
}

/** Pick the most likely phone and name column indices from a header row. */
function detectColumns(headers: string[]): { phoneIdx: number; nameIdx: number } {
  const phoneKw = ['phone', 'mobile', 'number', 'tel', 'contact', 'whatsapp', 'cell', 'msisdn']
  const nameKw = ['name', 'full', 'member', 'first', 'last']

  let phoneIdx = headers.findIndex((h) => phoneKw.some((k) => h.toLowerCase().includes(k)))
  let nameIdx = headers.findIndex((h) => nameKw.some((k) => h.toLowerCase().includes(k)))

  if (phoneIdx === -1) phoneIdx = 0
  if (nameIdx === -1) nameIdx = phoneIdx === 0 ? 1 : 0
  // Don't use the same column for both
  if (nameIdx === phoneIdx) nameIdx = phoneIdx === 0 ? 1 : 0

  return { phoneIdx, nameIdx }
}

/** Convert a 2-D array of strings (from XLSX) into ParsedRow[]. */
function parseSheetRows(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return []

  let dataRows = rows
  let phoneIdx = 0
  let nameIdx = 1

  // If first row looks like headers (first cell has < 7 digits), treat it as such
  const firstCellDigits = String(rows[0][0] ?? '').replace(/\D/g, '')
  if (firstCellDigits.length < 7) {
    const cols = detectColumns(rows[0].map((c) => String(c ?? '')))
    phoneIdx = cols.phoneIdx
    nameIdx = cols.nameIdx
    dataRows = rows.slice(1)
  }

  return dataRows
    .filter((row) => row.some((c) => String(c ?? '').trim()))
    .map((row) => {
      const rawPhone = String(row[phoneIdx] ?? '').trim()
      const name = String(row[nameIdx] ?? '').trim()
      const { phone, warning } = normalizePhone(rawPhone)
      return { rawPhone, phone, name, warning }
    })
    .filter((r) => r.rawPhone || r.name)
}

interface Props {
  churchId: number
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ImportMembersDialog({ churchId, open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  const importMutation = useMutation({
    mutationFn: (members: { phone_number: string; name?: string }[]) =>
      bulkAddChurchMembers(churchId, members),
    onSuccess: (data) => {
      setResult(data)
      setStep('done')
      qc.invalidateQueries({ queryKey: ['churches', churchId, 'members'] })
    },
  })

  const processFile = useCallback((file: File) => {
    setParseError('')
    setFileName(file.name)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const reader = new FileReader()

    reader.onerror = () => setParseError('Could not read the file.')

    if (ext === 'csv' || ext === 'txt') {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const wb = XLSX.read(text, { type: 'string' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false }) as string[][]
          const parsed = parseSheetRows(data)
          if (parsed.length === 0) {
            setParseError('No rows found in the file.')
            return
          }
          setRows(parsed)
          setStep('preview')
        } catch {
          setParseError('Failed to parse CSV. Make sure it is a valid CSV file.')
        }
      }
      reader.readAsText(file)
    } else {
      reader.onload = (e) => {
        try {
          const bytes = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(bytes, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false }) as string[][]
          const parsed = parseSheetRows(data)
          if (parsed.length === 0) {
            setParseError('No rows found in the file.')
            return
          }
          setRows(parsed)
          setStep('preview')
        } catch {
          setParseError('Failed to parse Excel file. Try saving as CSV and importing that instead.')
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  function reset() {
    setStep('upload')
    setRows([])
    setFileName('')
    setResult(null)
    setParseError('')
    importMutation.reset()
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleImport() {
    const members = validRows.map((r) => ({
      phone_number: r.phone!,
      ...(r.name ? { name: r.name } : {}),
    }))
    importMutation.mutate(members)
  }

  const validRows = rows.filter((r) => r.phone !== null)
  const invalidRows = rows.filter((r) => r.phone === null)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Import Members from File</DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary/60 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drop a CSV or Excel file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-3">Accepted formats: .csv · .xlsx · .xls</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
              }}
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            <div className="rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supported phone formats</p>
              <p>
                <span className="font-mono">0712345678</span> ·{' '}
                <span className="font-mono">712345678</span> ·{' '}
                <span className="font-mono">254712345678</span> ·{' '}
                <span className="font-mono">0112345678</span> ·{' '}
                <span className="font-mono">112345678</span>
              </p>
              <p className="pt-1">
                The file needs at least a <strong>phone number</strong> column. A name column is
                optional. Column headers are auto-detected.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px]">{fileName}</span>
              <div className="flex gap-3 shrink-0">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {invalidRows.length} skipped
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-auto flex-1 border rounded-md min-h-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone (normalized)</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r.phone === null ? 'opacity-40' : ''}>
                      <TableCell className="font-mono text-sm">
                        {r.phone ?? r.rawPhone}
                      </TableCell>
                      <TableCell>{r.name || '—'}</TableCell>
                      <TableCell>
                        {r.warning ? (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              r.phone ? 'text-amber-600' : 'text-destructive'
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {r.warning}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {importMutation.isError && (
              <p className="text-sm text-destructive">
                {(importMutation.error as Error)?.message ?? 'Import failed'}
              </p>
            )}

            <div className="flex justify-between items-center pt-1">
              <Button variant="ghost" size="sm" onClick={reset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending
                  ? 'Importing…'
                  : `Import ${validRows.length} member${validRows.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && result && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Import complete
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-600">{result.added}</div>
                <div className="text-xs text-muted-foreground mt-1">New members</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-xs text-muted-foreground mt-1">Updated</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-destructive">{result.failed.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Failed</div>
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-muted-foreground">Failed entries:</p>
                <div className="rounded-md border bg-muted/40 px-3 py-2 space-y-0.5 max-h-32 overflow-auto">
                  {result.failed.map((f, i) => (
                    <div key={i} className="font-mono text-xs text-destructive">
                      {f.phone_number || '(empty)'}: {f.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset}>
                Import another
              </Button>
              <Button onClick={() => { reset(); onOpenChange(false) }}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getChurchAdmins,
  addChurchAdmin,
  updateChurchAdmin,
  removeChurchAdmin,
} from '@/api/churches'
import { useAuthStore } from '@/stores/authStore'
import type { ChurchAdminMember, ChurchAdminPermissions } from '@/types/church'

const PERMISSION_LABELS: { key: keyof ChurchAdminPermissions; label: string }[] = [
  { key: 'can_manage_members',  label: 'Manage members'  },
  { key: 'can_edit_church',     label: 'Edit church'     },
  { key: 'can_send_campaigns',  label: 'Send campaigns'  },
  { key: 'can_view_analytics',  label: 'View analytics'  },
  { key: 'can_manage_admins',   label: 'Manage admins'   },
  { key: 'can_record_manual_donations', label: 'Manual entry' },
]

const DEFAULT_PERMISSIONS: ChurchAdminPermissions = {
  can_manage_members:  false,
  can_edit_church:     false,
  can_send_campaigns:  false,
  can_view_analytics:  false,
  can_manage_admins:   false,
  can_record_manual_donations: false,
}

interface Props {
  churchId: number
}

export function AdminMembersPanel({ churchId }: Props) {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addPerms, setAddPerms] = useState<ChurchAdminPermissions>({ ...DEFAULT_PERMISSIONS })
  const [notify, setNotify] = useState(false)

  const adminsQuery = useQuery({
    queryKey: ['churches', churchId, 'admins'],
    queryFn: () => getChurchAdmins(churchId),
  })

  const admins = adminsQuery.data?.admins ?? []
  const slots  = adminsQuery.data?.slots  ?? { total: 4, used: 0 }

  // Determine if current user can manage admins
  const myEntry = admins.find((a) => a.user_id === currentUser?.id)
  const canManageAdmins = myEntry?.is_owner || myEntry?.can_manage_admins || false

  const addMutation = useMutation({
    mutationFn: () => addChurchAdmin(churchId, addEmail, addPerms, notify),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches', churchId, 'admins'] })
      setAddOpen(false)
      setAddEmail('')
      setAddPerms({ ...DEFAULT_PERMISSIONS })
      setNotify(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeChurchAdmin(churchId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches', churchId, 'admins'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: Partial<ChurchAdminPermissions> }) =>
      updateChurchAdmin(churchId, userId, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches', churchId, 'admins'] }),
  })

  const togglePermission = (admin: ChurchAdminMember, key: keyof ChurchAdminPermissions) => {
    if (admin.is_owner || !admin.user_id) return
    updateMutation.mutate({
      userId: admin.user_id,
      permissions: { [key]: !admin[key] },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {slots.used} / {slots.total} admin slots used
        </p>
        {canManageAdmins && slots.used < slots.total && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Church Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email">Email address</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The user must already have an account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  {PERMISSION_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={addPerms[key]}
                        onChange={(e) =>
                          setAddPerms((p) => ({ ...p, [key]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    Send email notification to this admin
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground pl-6">
                    They will receive an email letting them know they've been added.
                  </p>
                </div>

                {addMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(addMutation.error as Error)?.message ?? 'Failed to add admin'}
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={() => addMutation.mutate()}
                  disabled={!addEmail || addMutation.isPending}
                >
                  {addMutation.isPending ? 'Adding…' : 'Add Admin'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {adminsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              {PERMISSION_LABELS.map(({ label }) => (
                <TableHead key={label} className="text-center text-xs">
                  {label}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.user_id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {admin.user?.username ?? admin.user?.email ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">{admin.user?.email}</span>
                  </div>
                  {admin.is_owner && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Owner
                    </Badge>
                  )}
                </TableCell>

                {PERMISSION_LABELS.map(({ key }) => (
                  <TableCell key={key} className="text-center">
                    {admin.is_owner ? (
                      <Shield className="mx-auto h-4 w-4 text-muted-foreground" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={admin[key] as boolean}
                        onChange={() => togglePermission(admin, key)}
                        disabled={!canManageAdmins || updateMutation.isPending}
                        className="h-4 w-4 cursor-pointer rounded"
                      />
                    )}
                  </TableCell>
                ))}

                <TableCell>
                  {!admin.is_owner && canManageAdmins && admin.user_id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeMutation.mutate(admin.user_id!)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

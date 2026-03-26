import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MailPlus, Trash2 } from 'lucide-react'
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
import { getChurchInvites, createMemberInvite, cancelMemberInvite } from '@/api/churches'
import type { MemberInvite } from '@/types/church'

const STATUS_VARIANT: Record<MemberInvite['status'], 'default' | 'outline' | 'destructive' | 'secondary'> = {
  pending:  'secondary',
  accepted: 'default',
  expired:  'outline',
}

interface Props {
  churchId: number
}

export function MemberInvitePanel({ churchId }: Props) {
  const qc = useQueryClient()

  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')

  const invitesQuery = useQuery({
    queryKey: ['churches', churchId, 'invites'],
    queryFn: () => getChurchInvites(churchId),
  })

  const invites = invitesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: () =>
      createMemberInvite(churchId, {
        phone_number: phone.replace(/^\+/, ''),
        name: name || undefined,
        email,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['churches', churchId, 'invites'] })
      setOpen(false)
      setPhone('')
      setName('')
      setEmail('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (inviteId: number) => cancelMemberInvite(churchId, inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['churches', churchId, 'invites'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {invites.filter((i) => i.status === 'pending').length} pending invite
          {invites.filter((i) => i.status === 'pending').length !== 1 ? 's' : ''}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MailPlus className="mr-1.5 h-4 w-4" />
              Invite via Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member by Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="invite-phone">WhatsApp number</Label>
                <Input
                  id="invite-phone"
                  placeholder="+254700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  An invitation link will be sent here. Expires in 7 days.
                </p>
              </div>

              {createMutation.isError && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as Error)?.message ?? 'Failed to send invite'}
                </p>
              )}

              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!phone || !email || createMutation.isPending}
              >
                {createMutation.isPending ? 'Sending…' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invitesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-mono text-sm">{invite.phone_number}</TableCell>
                <TableCell>{invite.name ?? '—'}</TableCell>
                <TableCell className="text-sm">{invite.email}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[invite.status]} className="capitalize">
                    {invite.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(invite.expires_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {invite.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => cancelMutation.mutate(invite.id)}
                      disabled={cancelMutation.isPending}
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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSystemStats, listAllUsers, deactivateUser, activateUser, getDriveStatus } from '@/api/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Users, Building2, MessageCircle, Megaphone, HandCoins, ShieldCheck, UserX, UserCheck, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react'


export default function AdminPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getSystemStats })
  const driveQuery = useQuery({ queryKey: ['admin', 'drive-status'], queryFn: getDriveStatus })
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => listAllUsers(page),
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const stats = statsQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview"
        description="Platform-wide stats and user management"
        action={
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Super Admin
          </div>
        }
      />

      {/* System-wide stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Church Admins" value={stats?.total_users} icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={statsQuery.isLoading} />
        <StatCard title="Churches" value={stats?.total_churches} icon={<Building2 className="h-4 w-4 text-muted-foreground" />} loading={statsQuery.isLoading} />
        <StatCard title="Messages" value={stats?.total_messages} icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />} loading={statsQuery.isLoading} />
        <StatCard title="Campaigns" value={stats?.total_campaigns} icon={<Megaphone className="h-4 w-4 text-muted-foreground" />} loading={statsQuery.isLoading} />
        <StatCard
          title="Total Donations"
          value={stats ? formatCurrency(stats.total_donations) : undefined}
          icon={<HandCoins className="h-4 w-4 text-muted-foreground" />}
          loading={statsQuery.isLoading}
        />
      </div>

      {/* Google Drive Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Google Drive Integration</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Required to create church folders and spreadsheets
              </CardDescription>
            </div>
          </div>
          {driveQuery.isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : driveQuery.data?.has_drive_auth ? (
            <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
              <AlertCircle className="h-3 w-3" />
              Not connected
            </Badge>
          )}
        </CardHeader>
        {!driveQuery.isLoading && !driveQuery.data?.has_drive_auth && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              Authorize Google Drive access so the system can create folders and spreadsheets in your Drive on behalf of new churches.
            </p>
            <Button
              size="sm"
              onClick={() => {
                const url = `/api/v1/auth/google/authorize-sheets/redirect?callback_url=${encodeURIComponent(`${window.location.origin}/auth/google/callback`)}`
                window.location.href = url
              }}
            >
              Authorize Google Drive
            </Button>
          </CardContent>
        )}
      </Card>

      {/* User management table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Church Admin Accounts</CardTitle>
          {usersQuery.data && (
            <span className="text-xs text-muted-foreground">{usersQuery.data.total} users</span>
          )}
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Churches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data?.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'super_admin' ? 'default' : 'secondary'}>
                          {u.role === 'super_admin' ? 'Super Admin' : 'Church Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.church_count}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'outline' : 'destructive'}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== 'super_admin' && (
                          u.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={deactivateMutation.isPending}
                              onClick={() => deactivateMutation.mutate(u.id)}
                            >
                              <UserX className="h-3.5 w-3.5 mr-1" />
                              Disable
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={activateMutation.isPending}
                              onClick={() => activateMutation.mutate(u.id)}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              Enable
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersQuery.data && usersQuery.data.pages > 1 && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="flex items-center px-2 text-sm text-muted-foreground">
                    {page} / {usersQuery.data.pages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= usersQuery.data.pages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, loading }: {
  title: string
  value: string | number | undefined
  icon: React.ReactNode
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{value ?? '—'}</div>}
      </CardContent>
    </Card>
  )
}

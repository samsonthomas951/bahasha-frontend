import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSystemStats, listAllUsers, deactivateUser, activateUser } from '@/api/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Users, Building2, MessageCircle, Megaphone, HandCoins, ShieldCheck, UserX, UserCheck } from 'lucide-react'

export default function AdminPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getSystemStats })
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

import { LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useChurchStore } from '@/stores/churchStore'
import { isSuperAdmin } from '@/types/auth'
import { useQuery } from '@tanstack/react-query'
import { getChurch } from '@/api/churches'

export function TopBar() {
  const { user, logoutMutation } = useAuth()
  const activeChurchId = useChurchStore((s) => s.activeChurchId)
  const isSuper = isSuperAdmin(user)

  const { data: activeChurch } = useQuery({
    queryKey: ['church', activeChurchId],
    queryFn: () => getChurch(activeChurchId!),
    enabled: !isSuper && !!activeChurchId,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="text-sm text-muted-foreground">
        {isSuper ? (
          <span className="font-medium text-primary">System Admin</span>
        ) : activeChurch ? (
          <span className="font-medium">{activeChurch.name}</span>
        ) : activeChurchId ? (
          <span className="animate-pulse">Loading church…</span>
        ) : (
          <span>No church selected — <a href="/churches/new" className="text-primary underline-offset-4 hover:underline">set up your church</a></span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <span className="max-w-32 truncate font-medium">{user?.username ?? 'Account'}</span>
            {isSuper && (
              <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px]">
                Super Admin
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
            {user?.email}
          </DropdownMenuLabel>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-1">
            {isSuper ? 'System Administrator' : 'Church Admin'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

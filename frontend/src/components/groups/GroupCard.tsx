import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Group } from '@/types/group'

interface Props {
  group: Group
}

export function GroupCard({ group }: Props) {
  return (
    <Link to={`/groups/${group.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {group.icon && <span>{group.icon}</span>}
              {group.name}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">{group.code}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {group.description && (
            <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{group.description}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

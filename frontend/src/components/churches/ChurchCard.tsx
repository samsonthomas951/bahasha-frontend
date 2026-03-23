import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SheetsStatusBadge } from './SheetsStatusBadge'
import type { Church } from '@/types/church'

interface Props {
  church: Church
}

export function ChurchCard({ church }: Props) {
  return (
    <Link to={`/churches/${church.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              {church.name}
            </CardTitle>
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {church.code}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(church.city || church.country) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {[church.city, church.country].filter(Boolean).join(', ')}
            </div>
          )}
          <SheetsStatusBadge churchId={church.id} initialStatus={church.sheets_status} />
        </CardContent>
      </Card>
    </Link>
  )
}

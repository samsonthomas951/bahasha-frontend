import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  )
}

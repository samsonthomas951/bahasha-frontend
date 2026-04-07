import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getConversations } from '@/api/messages'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationItem } from './ConversationItem'
import type { Conversation } from '@/types/message'

const PER_PAGE = 50

interface Props {
  activeConversationId: string | null
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ activeConversationId, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['messages', 'conversations', { search, page }],
    queryFn: () => getConversations({ search: search || undefined, per_page: PER_PAGE, page }),
  })

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  const total = data?.total ?? 0
  const totalPages = data?.pages ?? 1

  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations…"
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations</p>
        ) : (
          data?.items.map((c) => (
            <ConversationItem
              key={c.conversation_id}
              conversation={c}
              isActive={c.conversation_id === activeConversationId}
              onClick={() => onSelect(c)}
            />
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="border-t px-3 py-2 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
          </p>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

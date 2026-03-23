import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { sendMessage } from '@/api/messages'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Message } from '@/types/message'

interface Props {
  phoneNumber: string
  conversationId: string
}

export function MessageInput({ phoneNumber, conversationId }: Props) {
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      sendMessage({ phone_number: phoneNumber, message_type: 'text', content: text }),
    onSuccess: (msg: Message) => {
      setText('')
      // Optimistically add the message to the cache
      qc.setQueryData(
        ['messages', 'conversation', conversationId, { page: 1 }],
        (old: { items: Message[]; total: number } | undefined) => {
          if (!old) return old
          return { ...old, items: [msg, ...old.items], total: old.total + 1 }
        },
      )
    },
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim()) mutation.mutate()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Textarea
        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        className="max-h-32 min-h-9 resize-none"
        disabled={mutation.isPending}
      />
      <Button
        size="icon"
        onClick={() => { if (text.trim()) mutation.mutate() }}
        disabled={!text.trim() || mutation.isPending}
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

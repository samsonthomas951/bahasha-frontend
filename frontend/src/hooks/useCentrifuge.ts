import { useEffect, useRef, useState } from 'react'
import { Centrifuge } from 'centrifuge'
import { getCentrifugoToken } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

let centrifugeInstance: Centrifuge | null = null

export function useCentrifuge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [connected, setConnected] = useState(false)
  const instanceRef = useRef<Centrifuge | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    if (centrifugeInstance) {
      instanceRef.current = centrifugeInstance
      return
    }

    const centrifuge = new Centrifuge(
      import.meta.env.VITE_CENTRIFUGO_URL ?? 'ws://localhost:8000/connection/websocket',
      {
        getToken: async () => {
          try {
            const { token } = await getCentrifugoToken()
            return token
          } catch {
            return ''
          }
        },
      },
    )

    centrifuge.on('connected', () => setConnected(true))
    centrifuge.on('disconnected', () => setConnected(false))

    centrifuge.connect()
    centrifugeInstance = centrifuge
    instanceRef.current = centrifuge

    return () => {
      centrifuge.disconnect()
      centrifugeInstance = null
    }
  }, [isAuthenticated])

  return { centrifuge: instanceRef.current, connected }
}

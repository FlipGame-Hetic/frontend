import { useCallback, useEffect, useRef, useState } from "react"
import type { ConnectionStatus, ScreenEnvelope, ScreenId } from "@frontend/types"
import { RECONNECT_DELAY_MS, DEFAULT_SCREEN_HUB_URL } from "./wsConfig"

export interface UseScreenSocketOptions {
  screenId: ScreenId
  token: string
  baseUrl?: string
  onMessage?: (envelope: ScreenEnvelope) => void
}

export interface UseScreenSocketReturn {
  status: ConnectionStatus
  send: (envelope: ScreenEnvelope) => void
}

export function useScreenSocket(options: UseScreenSocketOptions): UseScreenSocketReturn {
  const { screenId, token } = options

  const baseUrl =
    options.baseUrl ??
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_HUB_URL ??
    DEFAULT_SCREEN_HUB_URL

  const wsUrl = `${baseUrl}/ws/screen/${screenId}?token=${token}`

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onMessageRef = useRef(options.onMessage)

  useEffect(() => {
    onMessageRef.current = options.onMessage
  })

  const send = useCallback((envelope: ScreenEnvelope) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(envelope))
    }
  }, [])

  useEffect(() => {
    if (!token) return

    let disposed = false

    function connect() {
      if (disposed) return
      setStatus("connecting")

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        setStatus("connected")
      }

      ws.onmessage = (event: MessageEvent) => {
        if (disposed) return
        const raw = typeof event.data === "string" ? event.data : ""
        try {
          const parsed = JSON.parse(raw) as ScreenEnvelope
          onMessageRef.current?.(parsed)
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus("disconnected")
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [wsUrl, token])

  return { status, send }
}

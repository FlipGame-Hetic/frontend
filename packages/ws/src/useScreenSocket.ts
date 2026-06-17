import { useCallback, useEffect, useRef, useState } from "react"
import type { ConnectionStatus, ScreenEnvelope, ScreenId } from "@frontend/types"
import { DEFAULT_SCREEN_HUB_URL, RECONNECT_DELAY_MS, resolveScreenHubUrl } from "./wsConfig"
import { redactToken, wsLog, wsWarn } from "./wsLog"

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

  const scope = `screen:${screenId}`

  const baseUrl = token ? resolveScreenHubUrl(options.baseUrl) : DEFAULT_SCREEN_HUB_URL

  const wsUrl = `${baseUrl}/ws/screen/${screenId}?token=${token}`

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onMessageRef = useRef(options.onMessage)

  useEffect(() => {
    onMessageRef.current = options.onMessage
  })

  const send = useCallback(
    (envelope: ScreenEnvelope) => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        wsLog(scope, "send →", envelope)
        ws.send(JSON.stringify(envelope))
      } else {
        wsWarn(
          scope,
          `send dropped (socket not open, readyState=${String(ws?.readyState)})`,
          envelope,
        )
      }
    },
    [scope],
  )

  useEffect(() => {
    if (!token) {
      wsWarn(scope, "NOT connecting — VITE_SCREEN_TOKEN is empty, screen hub disabled")
      return
    }

    wsLog(scope, `token=${redactToken(token)}`)

    let disposed = false

    function connect() {
      if (disposed) return
      setStatus("connecting")
      wsLog(scope, "connecting to", wsUrl)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        setStatus("connected")
        wsLog(scope, "OPEN ✓", wsUrl)
      }

      ws.onmessage = (event: MessageEvent) => {
        if (disposed) return
        const raw = typeof event.data === "string" ? event.data : ""
        try {
          const parsed = JSON.parse(raw) as ScreenEnvelope
          wsLog(scope, "recv ←", parsed)
          onMessageRef.current?.(parsed)
        } catch {
          wsWarn(scope, "recv ← (malformed frame, ignored)", raw)
        }
      }

      ws.onclose = (event: CloseEvent) => {
        if (disposed) return
        setStatus("disconnected")
        wsWarn(
          scope,
          `CLOSED code=${String(event.code)} reason="${event.reason}" wasClean=${String(event.wasClean)} — reconnecting in ${String(RECONNECT_DELAY_MS)}ms`,
        )
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        wsWarn(scope, "ERROR on", wsUrl)
        ws.close()
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [wsUrl, token, scope])

  return { status, send }
}

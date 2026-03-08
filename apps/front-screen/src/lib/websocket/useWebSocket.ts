import { useCallback, useEffect, useRef, useState } from "react"

import type { ClientMessage, ConnectionStatus, ServerMessage } from "./websocket.types"

const MAX_RECONNECT_DELAY = 30_000

interface UseWebSocketOptions {
  /** Appelé à chaque message reçu du serveur, dans le handler WebSocket (pas dans un effect) */
  onMessage?: (message: ServerMessage) => void
}

interface UseWebSocketReturn {
  /** État actuel de la connexion */
  status: ConnectionStatus
  /** Envoie un message typé au serveur */
  sendMessage: (message: ClientMessage) => void
}

/**
 * Hook React pour gérer une connexion WebSocket avec auto-reconnexion
 * et backoff exponentiel (1s, 2s, 4s, 8s… max 30s).
 *
 * @param url - URL du serveur WebSocket (ex: "ws://localhost:3001")
 * @param options.onMessage - Callback appelé à chaque message entrant
 *
 * @example
 * ```tsx
 * const { status, sendMessage } = useWebSocket(import.meta.env.VITE_WS_URL, {
 *   onMessage: (msg) => {
 *     if (msg.type === 'game:state') { ... }
 *   }
 * })
 *
 * sendMessage({ type: 'flipper:left' })
 * ```
 */
export function useWebSocket(url: string, options?: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const unmountedRef = useRef(false)
  const onMessageRef = useRef<UseWebSocketOptions["onMessage"]>(undefined)
  const connectRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    onMessageRef.current = options?.onMessage
  }, [options?.onMessage])

  const connect = useCallback(() => {
    if (unmountedRef.current) return

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close()
        return
      }
      setStatus("connected")
      reconnectAttemptRef.current = 0
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage
        onMessageRef.current?.(message)
      } catch (err) {
        console.error("[useWebSocket] Erreur de parsing:", err)
      }
    }

    ws.onclose = () => {
      if (unmountedRef.current) return
      setStatus("disconnected")
      wsRef.current = null

      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), MAX_RECONNECT_DELAY)
      console.warn(`[useWebSocket] Reconnexion dans ${String(delay)}ms...`)
      reconnectAttemptRef.current += 1

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!unmountedRef.current) {
          setStatus("connecting")
          connectRef.current?.()
        }
      }, delay)
    }

    ws.onerror = (event: Event) => {
      console.error("[useWebSocket] Erreur:", event)
    }
  }, [url])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    unmountedRef.current = false
    connect()

    return () => {
      unmountedRef.current = true

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn("[useWebSocket] Impossible d'envoyer, WebSocket non connecté")
    }
  }, [])

  return { status, sendMessage }
}

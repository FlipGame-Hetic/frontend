import type { CSSProperties, FC } from "react"
import type { ConnectionStatus } from "@frontend/types"

interface ConnectionOverlayProps {
  status: ConnectionStatus
}

const STATUS_COPY: Record<
  Exclude<ConnectionStatus, "connected">,
  { label: string; color: string }
> = {
  connecting: { label: "Reconnexion…", color: "#22d3ee" },
  disconnected: { label: "Connexion perdue", color: "#f43f5e" },
}

const containerStyle: CSSProperties = {
  position: "fixed",
  top: 16,
  right: 16,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  borderRadius: 9999,
  fontFamily: "monospace",
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#e2e8f0",
  background: "rgba(2, 6, 23, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  backdropFilter: "blur(4px)",
  pointerEvents: "none",
}

export const ConnectionOverlay: FC<ConnectionOverlayProps> = ({ status }) => {
  const copy = status === "connected" ? null : STATUS_COPY[status]
  if (!copy) return null

  const { label, color } = copy

  return (
    <div style={containerStyle}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: status === "connecting" ? "spamer-pulse 1s ease-in-out infinite" : undefined,
        }}
      />
      <span>{label}</span>
      <style>{"@keyframes spamer-pulse{0%,100%{opacity:1}50%{opacity:0.3}}"}</style>
    </div>
  )
}

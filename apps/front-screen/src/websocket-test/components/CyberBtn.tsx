import { cn } from "@frontend/utils"

import { colors } from "@/websocket-test/config/colors"
import type { Color, Dispatcher } from "@/websocket-test/types"

interface Props {
  label: string
  event: string
  payload?: unknown
  color: Color
  onDispatch: Dispatcher
}

export function CyberBtn({ label, event, payload = {}, color, onDispatch }: Props) {
  const c = colors[color]
  return (
    <button
      onClick={() => {
        onDispatch(event, payload)
      }}
      className={cn(
        "w-full bg-transparent px-4 py-3",
        "border text-xs font-bold tracking-widest uppercase",
        "cursor-pointer transition-all duration-150 active:scale-95",
        c.border,
        c.text,
        c.hover,
        c.textGlow,
        c.btnShadow,
      )}
    >
      {label}
    </button>
  )
}

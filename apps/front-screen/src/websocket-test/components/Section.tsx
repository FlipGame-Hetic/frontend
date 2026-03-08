import { cn } from "@frontend/utils"

import { colors } from "@/websocket-test/config/colors"
import type { Color } from "@/websocket-test/types"

interface Props {
  title: string
  color: Color
  children: React.ReactNode
}

export function Section({ title, color, children }: Props) {
  const c = colors[color]
  return (
    <div className={cn("border p-4", c.border, c.sectionShadow)}>
      <div
        className={cn(
          "mb-3 text-[10px] tracking-[0.35em] uppercase opacity-70",
          c.text,
          c.textGlow,
        )}
      >
        {"// "}
        {title}
      </div>
      {children}
    </div>
  )
}

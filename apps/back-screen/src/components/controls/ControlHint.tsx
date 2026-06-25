import { runtimeEnvironment } from "@frontend/utils"
import type { ControlHintDescriptor } from "./controlsConfig"

interface ControlHintProps {
  control: ControlHintDescriptor
  side?: "left" | "right"
}

export function ControlHint({ control, side = "left" }: ControlHintProps) {
  const isCabinet = runtimeEnvironment.isProductionCabinet

  const marker = isCabinet ? (
    <span
      className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-[clamp(0.36rem,0.8vw,0.56rem)] font-bold tracking-wider ${control.cabinet.filled ? "border border-white/70 bg-white/85 text-[#0a0d14] shadow-[0_0_10px_rgba(255,255,255,0.35)]" : "border border-white/45 bg-transparent text-white/70"}`}
    >
      {control.cabinet.token}
    </span>
  ) : (
    <span className="text-[rgba(85,234,212,0.85) flex items-center rounded-sm border border-[rgba(85,234,212,0.4)] px-2 py-1 font-mono text-[clamp(0.4rem,0.85vw,0.6rem)] tracking-wider">
      {control.browser.kind === "arrow" ? (
        <svg
          aria-hidden="true"
          className="block h-[clamp(0.6rem,1.3vw,0.9rem)] w-[clamp(0.6rem,1.3vw,0.9rem)]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          style={{ transform: control.browser.rotate }}
          viewBox="0 0 24 24"
        >
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
      ) : (
        control.browser.label
      )}
    </span>
  )

  const action = (
    <span
      className={`${isCabinet ? "text-[clamp(0.5rem,1.05vw,0.78rem)] text-[rgba(243,230,0,0.6)]" : "text-[clamp(0.34rem,0.7vw,0.5rem)] text-[rgba(243,230,0,0.55)]"} font-mono tracking-[0.2em] tracking-[0.22em] uppercase`}
    >
      {control.action}
    </span>
  )

  return (
    <div className={`flex items-center gap-3 ${side === "right" ? "justify-end" : ""}`}>
      {side === "right" ? (
        <>
          {action}
          {marker}
        </>
      ) : (
        <>
          {marker}
          {action}
        </>
      )}
    </div>
  )
}

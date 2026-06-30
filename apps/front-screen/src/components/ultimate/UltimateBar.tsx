import { Html } from "@react-three/drei"
import { useEffect, useState, type CSSProperties } from "react"
import { runtimeEnvironment } from "@frontend/utils"
import { CHARACTER_OPTIONS, GAME_PHASE } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"
import useUltimateStore from "@/stores/useUltimateStore"
import { useCurrentCharacterConfig } from "@/config/characterConfig"
import {
  CHARACTER_BY_ULTI_ID,
  ULTIMATE_ICON_BASE_PATH,
  ULTIMATE_OVERLAY_CONFIG,
} from "./ultimateConfig"

const ULTIMATE_ARC_PATHS = [
  { className: "ultimate-hud__arc--top-a", d: "M11 7 L20 3 L31 7 L42 2 L54 6" },
  { className: "ultimate-hud__arc--top-b", d: "M70 6 L83 1 L94 6 L106 3 L118 7" },
  { className: "ultimate-hud__arc--top-c", d: "M139 7 L151 3 L162 6 L173 2 L187 7" },
  { className: "ultimate-hud__arc--bottom-a", d: "M23 20 L35 24 L47 20 L58 25 L70 19" },
  { className: "ultimate-hud__arc--bottom-b", d: "M92 20 L103 25 L114 20 L126 24 L139 19" },
  { className: "ultimate-hud__arc--bottom-c", d: "M153 20 L164 24 L176 20 L187 25 L197 20" },
  { className: "ultimate-hud__arc--left", d: "M7 8 L1 13 L7 18 L3 22" },
  { className: "ultimate-hud__arc--right", d: "M201 5 L207 10 L201 15 L205 21" },
] as const

interface DrainState {
  ratio: number
  startedAt: number
}

const UltimateBar = () => {
  const phase = useGameStore((state) => state.phase)
  const config = useCurrentCharacterConfig()

  const charge = useUltimateStore((state) => state.charge)
  const chargeMax = useUltimateStore((state) => state.chargeMax)
  const ready = useUltimateStore((state) => state.ready)
  const nextUltiId = useUltimateStore((state) => state.nextUltiId)
  const active = useUltimateStore((state) => state.active)

  const [drainState, setDrainState] = useState<DrainState>({ ratio: 1, startedAt: 0 })

  useEffect(() => {
    if (!active || active.durationMs <= 0) return

    let raf = 0
    const tick = (): void => {
      const elapsed = performance.now() - active.startedAt
      const ratio = Math.max(0, 1 - elapsed / active.durationMs)
      setDrainState({ ratio, startedAt: active.startedAt })
      if (ratio > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [active])

  if (phase !== GAME_PHASE.Playing) return null

  const character = config.id

  // Reuses drainState.ratio only when it was computed for the current active ultimate
  const activeDrainRatio = active?.startedAt === drainState.startedAt ? drainState.ratio : 1
  const activeStartRatio =
    active && chargeMax > 0 ? Math.min(1, active.activationCharge / chargeMax) : 1
  const fillRatio = active
    ? activeStartRatio * activeDrainRatio
    : chargeMax > 0
      ? Math.min(1, charge / chargeMax)
      : 0

  // Converts Ghost's copied ultimate id into a character slug because icon files are named by character.
  // While an ultimate is active, the icon stays on the running ult (active.ultiId); nextUltiId only takes over once it ends/cancels.
  const ghostUltiId = active ? active.ultiId : nextUltiId
  const iconSlug =
    character === "ghost"
      ? ghostUltiId
        ? CHARACTER_BY_ULTI_ID[ghostUltiId]
        : CHARACTER_OPTIONS[0].id
      : character
  const locked = active !== null && !active.cancellable
  const glowing = ready || active !== null
  const state = active ? (locked ? "locked" : "active") : ready ? "ready" : "charging"

  const style = {
    "--ultimate-hud-bar-height": `${String(ULTIMATE_OVERLAY_CONFIG.barHeight)}px`,
    "--ultimate-hud-bar-width": `${String(ULTIMATE_OVERLAY_CONFIG.barWidth)}px`,
    "--ultimate-hud-color": config.color,
    "--ultimate-hud-fill-width": `${String(fillRatio * 100)}%`,
    "--ultimate-hud-glow": glowing ? config.glow : "0 0 0 rgba(0, 0, 0, 0)",
    "--ultimate-hud-icon-size": `${String(ULTIMATE_OVERLAY_CONFIG.iconSize)}px`,
    "--ultimate-hud-icon-url": `url("${ULTIMATE_ICON_BASE_PATH}/${iconSlug}.svg")`,
  } as CSSProperties

  return (
    <group position={[...ULTIMATE_OVERLAY_CONFIG.position]}>
      <Html
        center
        distanceFactor={ULTIMATE_OVERLAY_CONFIG.distanceFactor}
        sprite
        transform
        zIndexRange={[ULTIMATE_OVERLAY_CONFIG.renderOrder, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="ultimate-hud" data-state={state} style={style}>
          <span className="ultimate-hud__icon-frame" aria-hidden="true">
            <span className="ultimate-hud__icon" />
          </span>
          <div className="ultimate-hud__bar-shell" aria-hidden="true">
            <div className="ultimate-hud__bar">
              <span className="ultimate-hud__bar-fill" />
            </div>
            <svg
              className="ultimate-hud__arcs"
              focusable="false"
              preserveAspectRatio="none"
              viewBox="0 0 208 26"
            >
              {ULTIMATE_ARC_PATHS.map((path) => (
                <path
                  className={`ultimate-hud__arc ${path.className}`}
                  d={path.d}
                  key={path.className}
                />
              ))}
            </svg>
            <span className="ultimate-hud__button" aria-hidden="true">
              {runtimeEnvironment.isProductionCabinet ? (
                <span className="ultimate-hud__button-label">R2</span>
              ) : (
                <span className="ultimate-hud__button-glyph ultimate-hud__button-glyph--up" />
              )}
            </span>
          </div>
        </div>
      </Html>
    </group>
  )
}

export default UltimateBar

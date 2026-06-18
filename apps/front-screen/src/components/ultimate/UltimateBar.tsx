import { Html } from "@react-three/drei"
import { useEffect, useState, type CSSProperties } from "react"
import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterConfig, CharacterType } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"
import useUltimateStore from "@/stores/useUltimateStore"
import {
  DEBUG_FORCE_ULTIMATE_READY,
  ULTIMATE_ICON_BASE_PATH,
  ULTIMATE_OVERLAY_CONFIG,
} from "./ultimateConfig"

const configFor = (slug: CharacterType): CharacterConfig =>
  CHARACTER_OPTIONS.find((option) => option.id === slug) ?? CHARACTER_OPTIONS[0]

interface DrainState {
  ratio: number
  startedAt: number
}

const UltimateBar = () => {
  const phase = useGameStore((state) => state.phase)
  const selectedPlayers = useGameStore((state) => state.selectedPlayers)
  const currentPlayer = useGameStore((state) => state.currentPlayer)

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

  if (phase !== "playing") return null

  const character =
    selectedPlayers.find((player) => player.player === currentPlayer)?.character ??
    DEFAULT_CHARACTER
  const config = configFor(character)

  const readyForDisplay = ready || DEBUG_FORCE_ULTIMATE_READY
  const activeDrainRatio = active?.startedAt === drainState.startedAt ? drainState.ratio : 1
  const fillRatio = active
    ? activeDrainRatio
    : DEBUG_FORCE_ULTIMATE_READY
      ? 1
      : chargeMax > 0
        ? Math.min(1, charge / chargeMax)
        : 0

  const iconSlug =
    character === "ghost"
      ? (nextUltiId ?? (DEBUG_FORCE_ULTIMATE_READY ? "oracle" : null))
      : character
  const locked = active !== null && !active.cancellable
  const glowing = readyForDisplay || active !== null
  const state = active ? (locked ? "locked" : "active") : readyForDisplay ? "ready" : "charging"

  const style = {
    "--ultimate-hud-bar-height": `${String(ULTIMATE_OVERLAY_CONFIG.barHeight)}px`,
    "--ultimate-hud-bar-width": `${String(ULTIMATE_OVERLAY_CONFIG.barWidth)}px`,
    "--ultimate-hud-color": config.color,
    "--ultimate-hud-fill-width": `${String(fillRatio * 100)}%`,
    "--ultimate-hud-glow": glowing ? config.glow : "0 0 0 rgba(0, 0, 0, 0)",
    "--ultimate-hud-icon-size": `${String(ULTIMATE_OVERLAY_CONFIG.iconSize)}px`,
    "--ultimate-hud-icon-url": iconSlug
      ? `url("${ULTIMATE_ICON_BASE_PATH}/${iconSlug}.svg")`
      : "none",
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
          {iconSlug && <span className="ultimate-hud__icon" aria-hidden="true" />}
          <div className="ultimate-hud__bar" aria-hidden="true">
            <span className="ultimate-hud__bar-fill" />
          </div>
        </div>
      </Html>
    </group>
  )
}

export default UltimateBar

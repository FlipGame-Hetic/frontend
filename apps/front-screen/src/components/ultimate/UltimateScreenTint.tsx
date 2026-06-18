import type { UltiId } from "@frontend/types"
import useUltimateStore from "@/stores/useUltimateStore"

const TINT_BY_ULTI: Partial<Record<UltiId, string>> = {
  rampage: "rgba(40, 255, 60, 0.18)",
  time_slow: "rgba(120, 180, 255, 0.16)",
}

const UltimateScreenTint = () => {
  const active = useUltimateStore((state) => state.active)
  const tint = active ? TINT_BY_ULTI[active.ultiId] : undefined

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
        background: tint ?? "transparent",
        opacity: tint ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
    />
  )
}

export default UltimateScreenTint

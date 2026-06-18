import { useBackScreenStore } from "@/stores/useBackScreenStore"

export default function BossDamageOverlay() {
  const lastDamage = useBackScreenStore((s) => s.lastDamage)

  if (!lastDamage.big || lastDamage.at === 0) return null

  return (
    <div
      key={lastDamage.at}
      className="boss-screen-glitch pointer-events-none absolute inset-0 z-40 mix-blend-screen"
      style={{
        background:
          "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(197,0,60,0.55), rgba(197,0,60,0.9))",
      }}
    />
  )
}

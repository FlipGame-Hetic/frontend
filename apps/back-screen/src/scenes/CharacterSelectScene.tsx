import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { CHARACTER_OPTIONS } from "./scene.types"

export default function CharacterSelectScene() {
  const menuIndex = useBackScreenStore((s) => s.menuIndex)
  const active = CHARACTER_OPTIONS[menuIndex]

  return (
    <div className="bg-arcade-black relative flex h-full w-full overflow-hidden">
      <TronGrid />
      <Scanlines />
      <Vignette />
      <CornerDecorations />

      <div className="relative z-10 flex h-full w-full">
        <div className="flex flex-1 flex-col justify-center gap-8 px-16">
          <div
            className="font-arcade text-[clamp(0.4rem,1.2vw,0.7rem)] tracking-[0.3em] uppercase"
            style={{ color: "#FF6600" }}
          >
            CHOISIS TA BILLE
          </div>

          <div
            className="font-display text-[clamp(1.8rem,4vw,3.5rem)] leading-none font-black tracking-widest uppercase"
            style={{
              color: "#00D9E8",
              textShadow:
                "0 0 8px #00D9E8, 0 0 24px rgba(0,217,232,0.45), 0 0 60px rgba(0,217,232,0.15)",
            }}
          >
            {active?.label ?? "—"}
          </div>

          <div
            className="max-w-xs font-mono text-[clamp(0.65rem,1.3vw,0.9rem)] leading-relaxed"
            style={{ color: "#E8F4FF", opacity: 0.7 }}
          >
            {active?.locked ? "Non disponible pour l'instant." : active?.description}
          </div>

          <div
            className="font-arcade text-[clamp(0.35rem,0.9vw,0.6rem)] tracking-widest"
            style={{ color: "rgba(232,244,255,0.4)" }}
          >
            ← → NAVIGUER — ENTRÉE CHOISIR
          </div>
        </div>

        <div className="flex items-center justify-center pr-16">
          <div className="flex flex-col items-center gap-6">
            <BigBall option={active ?? CHARACTER_OPTIONS[0]} />

            <div className="flex gap-4">
              {CHARACTER_OPTIONS.map((opt, i) => (
                <div key={opt.id} className="flex flex-col items-center gap-1">
                  <SmallBall option={opt} isActive={i === menuIndex} />
                  {opt.locked && (
                    <div
                      className="font-arcade text-[clamp(0.2rem,0.45vw,0.3rem)] tracking-widest uppercase"
                      style={{ color: "rgba(232,244,255,0.3)" }}
                    >
                      bientôt
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BigBall({ option }: { option: (typeof CHARACTER_OPTIONS)[number] }) {
  return (
    <div
      className="rounded-full"
      style={{
        width: "clamp(120px, 18vw, 220px)",
        height: "clamp(120px, 18vw, 220px)",
        background: option.gradient,
        boxShadow: option.glow !== "none" ? option.glow : "none",
        transition: "all 0.3s ease",
      }}
    />
  )
}

function SmallBall({
  option,
  isActive,
}: {
  option: (typeof CHARACTER_OPTIONS)[number]
  isActive: boolean
}) {
  return (
    <div
      className="rounded-full transition-all duration-300"
      style={{
        width: 40,
        height: 40,
        background: option.gradient,
        boxShadow: isActive && option.glow !== "none" ? option.glow : "none",
        opacity: option.locked ? 0.18 : isActive ? 1 : 0.4,
        transform: isActive ? "scale(1.25)" : "scale(1)",
      }}
    />
  )
}

function TronGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,217,232,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,217,232,0.035) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  )
}

function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent 3px, rgba(0,0,0,0.24) 4px)",
      }}
    />
  )
}

function Vignette() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.8) 100%)",
      }}
    />
  )
}

function CornerDecorations() {
  return (
    <>
      <div
        className="absolute top-6 left-6 h-8 w-8 border-t-2 border-l-2"
        style={{ borderColor: "#00D9E8", boxShadow: "0 0 10px rgba(0,217,232,0.5)" }}
      />
      <div
        className="absolute top-6 right-6 h-8 w-8 border-t-2 border-r-2"
        style={{ borderColor: "#00D9E8", boxShadow: "0 0 10px rgba(0,217,232,0.5)" }}
      />
      <div
        className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2"
        style={{ borderColor: "#00D9E8", boxShadow: "0 0 10px rgba(0,217,232,0.5)" }}
      />
      <div
        className="absolute right-6 bottom-6 h-8 w-8 border-r-2 border-b-2"
        style={{ borderColor: "#00D9E8", boxShadow: "0 0 10px rgba(0,217,232,0.5)" }}
      />
    </>
  )
}

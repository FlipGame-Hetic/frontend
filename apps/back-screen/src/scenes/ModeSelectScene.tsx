import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { MODE_OPTIONS } from "./scene.types"

export default function ModeSelectScene() {
  const menuIndex = useBackScreenStore((s) => s.menuIndex)

  return (
    <div className="bg-arcade-black relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <TronGrid />
      <Scanlines />
      <Vignette />
      <CornerDecorations />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 px-8">
        <div
          className="font-arcade text-[clamp(0.4rem,1.2vw,0.7rem)] tracking-[0.3em] uppercase"
          style={{ color: "#FF6600" }}
        >
          SÉLECTION DU MODE
        </div>

        <div
          className="font-display text-center text-[clamp(2rem,5vw,4rem)] font-black tracking-widest uppercase"
          style={{
            color: "#00D9E8",
            textShadow:
              "0 0 8px #00D9E8, 0 0 24px rgba(0,217,232,0.45), 0 0 60px rgba(0,217,232,0.15)",
          }}
        >
          CHOISIS TON MODE
        </div>

        <div className="flex w-full justify-center gap-6">
          {MODE_OPTIONS.map((option, i) => {
            const isActive = i === menuIndex
            const isLocked = option.locked === true
            return (
              <div
                key={option.id}
                className="relative flex max-w-[280px] flex-1 flex-col gap-3 p-6 transition-all duration-300"
                style={{
                  border: `2px solid ${isLocked ? "rgba(232,244,255,0.1)" : isActive ? "#FF6600" : "rgba(0,217,232,0.2)"}`,
                  boxShadow:
                    !isLocked && isActive
                      ? "0 0 8px #FF6600, 0 0 24px rgba(255,102,0,0.5), 0 0 60px rgba(255,102,0,0.2)"
                      : "none",
                  transform: !isLocked && isActive ? "scale(1.04)" : "scale(0.96)",
                  opacity: isLocked ? 0.35 : isActive ? 1 : 0.5,
                  background: !isLocked && isActive ? "rgba(255,102,0,0.05)" : "transparent",
                }}
              >
                {isLocked && (
                  <div
                    className="font-arcade absolute top-3 right-3 px-2 py-1 text-[clamp(0.3rem,0.7vw,0.45rem)] tracking-widest uppercase"
                    style={{
                      color: "rgba(232,244,255,0.5)",
                      border: "1px solid rgba(232,244,255,0.15)",
                    }}
                  >
                    Bientôt
                  </div>
                )}
                <div
                  className="font-display text-[clamp(1.2rem,2.5vw,2rem)] font-black tracking-widest uppercase"
                  style={{
                    color: isLocked ? "rgba(232,244,255,0.3)" : isActive ? "#FF6600" : "#00D9E8",
                    textShadow:
                      !isLocked && isActive
                        ? "0 0 8px #FF6600, 0 0 24px rgba(255,102,0,0.5)"
                        : "none",
                  }}
                >
                  {option.label}
                </div>
                <div
                  className="font-mono text-[clamp(0.6rem,1.2vw,0.8rem)] leading-relaxed"
                  style={{ color: "#E8F4FF", opacity: isLocked ? 0.4 : 0.7 }}
                >
                  {option.description}
                </div>
              </div>
            )
          })}
        </div>

        <div
          className="font-arcade text-[clamp(0.35rem,1vw,0.6rem)] tracking-widest"
          style={{ color: "rgba(232,244,255,0.4)" }}
        >
          ← → NAVIGUER — ENTRÉE CONFIRMER
        </div>
      </div>
    </div>
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

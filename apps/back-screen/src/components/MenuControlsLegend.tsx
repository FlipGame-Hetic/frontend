import { runtimeEnvironment } from "@frontend/utils"

const CABINET_LEFT = [
  { token: "L1", action: "NAVIGUER", filled: true },
  { token: "L2", action: "RETOUR", filled: false },
] as const

const CABINET_RIGHT = [
  { token: "R1", action: "NAVIGUER", filled: true },
  { token: "R2", action: "VALIDER", filled: false },
] as const

const BROWSER_LEFT = [
  { kind: "arrow", rotate: "rotate(-90deg)", action: "NAVIGUER" },
  { kind: "text", label: "RETOUR ARR.", action: "RETOUR" },
] as const

const BROWSER_RIGHT = [
  { kind: "arrow", rotate: "rotate(90deg)", action: "NAVIGUER" },
  { kind: "text", label: "ENTRÉE", action: "VALIDER" },
] as const

const circleClass = (filled: boolean): string =>
  filled
    ? "border border-white/70 bg-white/85 text-[#0a0d14] shadow-[0_0_10px_rgba(255,255,255,0.35)]"
    : "border border-white/45 bg-transparent text-white/70"

const circleBase =
  "flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-[clamp(0.36rem,0.8vw,0.56rem)] font-bold tracking-wider"
const actionClassCabinet =
  "font-mono text-[clamp(0.5rem,1.05vw,0.78rem)] tracking-[0.2em] text-[rgba(243,230,0,0.6)] uppercase"
const actionClass =
  "font-mono text-[clamp(0.34rem,0.7vw,0.5rem)] tracking-[0.22em] text-[rgba(243,230,0,0.55)] uppercase"
const chipClass =
  "flex items-center rounded-sm border border-[rgba(85,234,212,0.4)] px-2 py-1 font-mono text-[clamp(0.4rem,0.85vw,0.6rem)] tracking-wider text-[rgba(85,234,212,0.85)]"
const arrowSvgClass = "block h-[clamp(0.6rem,1.3vw,0.9rem)] w-[clamp(0.6rem,1.3vw,0.9rem)]"

export function MenuControlsLegend() {
  if (runtimeEnvironment.isProductionCabinet) {
    return (
      <>
        <div className="absolute bottom-10 left-12 z-20 flex flex-col gap-3">
          {CABINET_LEFT.map((item) => (
            <div key={item.token} className="flex items-center gap-3">
              <span className={`${circleBase} ${circleClass(item.filled)}`}>{item.token}</span>
              <span className={actionClassCabinet}>{item.action}</span>
            </div>
          ))}
        </div>

        <div className="absolute right-12 bottom-10 z-20 flex flex-col gap-3">
          {CABINET_RIGHT.map((item) => (
            <div key={item.token} className="flex items-center justify-end gap-3">
              <span className={actionClassCabinet}>{item.action}</span>
              <span className={`${circleBase} ${circleClass(item.filled)}`}>{item.token}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="absolute bottom-10 left-12 z-20 flex flex-col gap-3">
        {BROWSER_LEFT.map((item) => (
          <div key={item.action} className="flex items-center gap-3">
            {item.kind === "arrow" ? (
              <span className={chipClass}>
                <svg
                  aria-hidden="true"
                  className={arrowSvgClass}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  style={{ transform: item.rotate }}
                  viewBox="0 0 24 24"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </span>
            ) : (
              <span className={chipClass}>{item.label}</span>
            )}
            <span className={actionClass}>{item.action}</span>
          </div>
        ))}
      </div>

      <div className="absolute right-12 bottom-10 z-20 flex flex-col gap-3">
        {BROWSER_RIGHT.map((item) => (
          <div key={item.action} className="flex items-center justify-end gap-3">
            <span className={actionClass}>{item.action}</span>
            {item.kind === "arrow" ? (
              <span className={chipClass}>
                <svg
                  aria-hidden="true"
                  className={arrowSvgClass}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  style={{ transform: item.rotate }}
                  viewBox="0 0 24 24"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </span>
            ) : (
              <span className={chipClass}>{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

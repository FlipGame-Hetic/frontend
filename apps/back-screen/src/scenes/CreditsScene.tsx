import { useEffect, useRef, useState } from "react"
import { ControlHint } from "../components/controls/ControlHint"
import { MENU_CONTROLS } from "../components/controls/controlsConfig"
import { CREDITS_SECTIONS, SCROLL_SPEED_PX_PER_SEC, START_DELAY_MS } from "./credits/creditsConfig"

function FinalCreditsBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none font-bold tracking-[0.16em] text-[#F3E600] uppercase [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
        S.P.A.M.E.R
      </div>
      <span className="font-mono text-[clamp(0.8rem,1.6vw,1.15rem)] tracking-[0.3em] text-[rgba(243,230,0,0.6)] uppercase">
        Merci d&apos;avoir joué !
      </span>
      <div className="font-mono text-[clamp(0.6rem,1vw,0.8rem)] tracking-[0.35em] text-[rgba(243,230,0,0.3)]">
        2026
      </div>
    </div>
  )
}

export default function CreditsScene() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const finalSlotRef = useRef<HTMLDivElement>(null)
  const finalLayerRef = useRef<HTMLDivElement>(null)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    const finalSlot = finalSlotRef.current
    const finalLayer = finalLayerRef.current
    if (!viewport || !content || !finalSlot || !finalLayer) return

    const vh = viewport.clientHeight
    const startY = vh
    const endY = -content.offsetHeight
    const startAtMs = performance.now() + START_DELAY_MS

    content.style.transition = "none"
    content.style.transform = `translateY(${String(startY)}px)`
    finalLayer.style.opacity = "0"

    let animationFrame = 0
    let hasEnded = false

    const animate = (nowMs: number) => {
      const elapsedMs = Math.max(0, nowMs - startAtMs)
      const scrollY = Math.max(endY, startY - (elapsedMs / 1000) * SCROLL_SPEED_PX_PER_SEC)

      content.style.transform = `translateY(${String(scrollY)}px)`

      const viewportRect = viewport.getBoundingClientRect()
      const finalSlotRect = finalSlot.getBoundingClientRect()
      const finalNormalTop = finalSlotRect.top - viewportRect.top
      const finalCenteredTop = viewportRect.height / 2 - finalSlotRect.height / 2
      const finalTop = Math.max(finalNormalTop, finalCenteredTop)

      finalLayer.style.opacity = "1"
      finalLayer.style.transform = `translate3d(0, ${String(finalTop)}px, 0)`

      if (scrollY <= endY) {
        if (!hasEnded) {
          hasEnded = true
          setEnded(true)
        }
        return
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div ref={viewportRef} className="absolute inset-0 z-40 overflow-hidden bg-[#05070d]">
      <div ref={contentRef} className="absolute top-0 left-0 w-full will-change-transform">
        <div className="mx-auto flex max-w-[62ch] flex-col items-center gap-24 px-12 py-24 text-center">
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none font-bold tracking-[0.16em] text-[#F3E600] uppercase [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
            S.P.A.M.E.R
          </h1>

          {CREDITS_SECTIONS.map((section) => (
            <section key={section.heading} className="flex w-full flex-col items-center gap-12">
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.7rem)] font-bold tracking-[0.3em] text-[rgba(85,234,212,0.85)] uppercase">
                  {section.heading}
                </h2>
                <div className="h-px w-20 bg-[linear-gradient(90deg,transparent,rgba(85,234,212,0.5),transparent)]" />
              </div>

              <div className="flex w-full flex-col items-center gap-11">
                {section.entries.map((entry, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    {entry.title && (
                      <h3 className="font-mono text-[clamp(0.72rem,1.4vw,1.05rem)] tracking-[0.28em] text-[rgba(243,230,0,0.55)] uppercase">
                        {entry.title}
                      </h3>
                    )}
                    {entry.message && (
                      <p className="max-w-[40ch] font-mono text-[clamp(0.95rem,1.8vw,1.3rem)] leading-relaxed text-[rgba(85,234,212,0.75)]">
                        {entry.message}
                      </p>
                    )}
                    {entry.items && (
                      <ul className="flex list-none flex-col items-center gap-2">
                        {entry.items.map((item) => (
                          <li
                            key={item}
                            className="font-display text-[clamp(1.5rem,3.2vw,2.5rem)] font-semibold tracking-wide text-[#F3E600]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div ref={finalSlotRef} aria-hidden="true" className="opacity-0">
            <FinalCreditsBlock />
          </div>
        </div>
      </div>

      <div
        ref={finalLayerRef}
        className="pointer-events-none absolute top-0 left-0 z-20 w-full px-12 text-center opacity-0 will-change-transform"
      >
        <FinalCreditsBlock />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-1600 ease-in ${
          ended ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      <div className="absolute bottom-10 left-12 z-10">
        <ControlHint control={MENU_CONTROLS.back} side="left" />
      </div>
    </div>
  )
}

export default function IdleScene() {
  return (
    <div className="bg-arcade-black relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <TronGrid />
      <Scanlines />
      <Vignette />
      <CornerDecorations />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div
          className="font-display text-center text-[clamp(3rem,8vw,7rem)] font-black tracking-widest uppercase"
          style={{
            color: "#00D9E8",
            textShadow:
              "0 0 8px #00D9E8, 0 0 24px rgba(0,217,232,0.45), 0 0 60px rgba(0,217,232,0.15)",
          }}
        >
          S.P.A.M.E.R.
        </div>

        <div className="h-px w-64 opacity-40" style={{ background: "#00D9E8" }} />

        <BlinkPrompt />
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

function BlinkPrompt() {
  return (
    <div
      className="font-arcade animate-pulse text-[clamp(0.5rem,1.5vw,0.85rem)] tracking-widest uppercase"
      style={{ color: "#FF6600", textShadow: "0 0 8px rgba(255,102,0,0.6)" }}
    >
      INSÉRER UNE PIÈCE
    </div>
  )
}

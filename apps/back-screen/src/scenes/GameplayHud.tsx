export default function GameplayHud() {
  return (
    <div className="bg-arcade-black relative flex h-full w-full items-center justify-center overflow-hidden">
      <TronGrid />
      <Scanlines />
      <Vignette />
      <CornerDecorations />

      <div className="relative z-10 text-center">
        <div
          className="font-display text-[clamp(4rem,12vw,10rem)] font-black tracking-[0.5em] uppercase italic"
          style={{
            color: "#00D9E8",
            textShadow:
              "0 0 8px #00D9E8, 0 0 24px rgba(0,217,232,0.45), 0 0 60px rgba(0,217,232,0.15)",
          }}
        >
          JOUE.
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

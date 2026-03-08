export function GridBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  )
}

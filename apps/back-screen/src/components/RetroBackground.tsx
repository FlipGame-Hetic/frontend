interface RetroBackgroundProps {
  accentColor?: string
  withBlur?: boolean
}

export function RetroBackground({
  accentColor = "#F3E600",
  withBlur = false,
}: RetroBackgroundProps) {
  return (
    <>
      <DiagonalGrid />
      {withBlur && <BlurOverlay />}
      <YellowScanlines />
      <Vignette />
      <CornerDecorations color={accentColor} />
    </>
  )
}

function DiagonalGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(45deg,rgba(243,230,0,0.03)_1px,transparent_1px),linear-gradient(-45deg,rgba(243,230,0,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />
  )
}

function BlurOverlay() {
  return <div className="absolute inset-0 z-[1] bg-[rgba(8,11,18,0.72)] backdrop-blur-[4px]" />
}

function YellowScanlines() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 bg-[repeating-linear-gradient(0deg,transparent_3px,rgba(243,230,0,0.028)_4px)]" />
  )
}

function Vignette() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_82%_76%_at_50%_50%,transparent_28%,rgba(0,0,0,0.65)_68%,rgba(0,0,0,0.97)_100%)]" />
  )
}

function CornerDecorations({ color }: { color: string }) {
  return (
    <>
      <div
        className="absolute top-5 left-5 z-30 h-12 w-12 border-t-[3px] border-l-[3px]"
        style={{ borderColor: color }}
      />
      <div className="absolute top-[17px] left-[17px] z-30 h-2 w-2" style={{ background: color }} />

      <div
        className="absolute top-5 right-5 z-30 h-12 w-12 border-t-[3px] border-r-[3px]"
        style={{ borderColor: color }}
      />
      <div
        className="absolute top-[17px] right-[17px] z-30 h-2 w-2"
        style={{ background: color }}
      />

      <div
        className="absolute bottom-5 left-5 z-30 h-12 w-12 border-b-[3px] border-l-[3px]"
        style={{ borderColor: color }}
      />
      <div
        className="absolute bottom-[17px] left-[17px] z-30 h-2 w-2"
        style={{ background: color }}
      />

      <div
        className="absolute right-5 bottom-5 z-30 h-12 w-12 border-r-[3px] border-b-[3px]"
        style={{ borderColor: color }}
      />
      <div
        className="absolute right-[17px] bottom-[17px] z-30 h-2 w-2"
        style={{ background: color }}
      />
    </>
  )
}

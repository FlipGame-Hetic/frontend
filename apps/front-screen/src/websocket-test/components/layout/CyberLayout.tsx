import { GridBackground } from "@/websocket-test/components/layout/GridBackground"
import { Scanlines } from "@/websocket-test/components/layout/Scanlines"

interface Props {
  children: React.ReactNode
}

export function CyberLayout({ children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020208] p-6 font-mono text-white">
      <Scanlines />
      <GridBackground />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6">{children}</div>
    </div>
  )
}

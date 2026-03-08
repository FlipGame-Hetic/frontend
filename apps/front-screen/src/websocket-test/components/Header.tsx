import type { ConnectionStatus } from "@frontend/types"
import { SocketStatus } from "@/websocket-test/components/SocketStatus"

interface Props {
  status: ConnectionStatus
}

export function Header({ status }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-cyan-400/20 pb-4">
      <div>
        <div className="mb-1 text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase">
          FlipGame // front-screen
        </div>
        <h1 className="text-3xl font-black tracking-[0.12em] text-cyan-400 uppercase [text-shadow:0_0_20px_#22d3ee,0_0_40px_#22d3ee55]">
          WebSocket
          <span className="text-fuchsia-400 [text-shadow:0_0_20px_#e879f9,0_0_40px_#e879f955]">
            {" "}
            Debug
          </span>
        </h1>
      </div>

      <SocketStatus status={status} />
    </header>
  )
}

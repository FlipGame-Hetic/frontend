import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

export function GameSection({ onDispatch }: Props) {
  return (
    <Section title="Game" color="green">
      <CyberBtn label="[ Start Game ]" event="game:start" color="green" onDispatch={onDispatch} />
    </Section>
  )
}

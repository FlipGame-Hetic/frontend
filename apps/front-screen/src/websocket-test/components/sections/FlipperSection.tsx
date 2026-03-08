import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

export function FlipperSection({ onDispatch }: Props) {
  return (
    <Section title="Flippers" color="cyan">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn
          label="◄ Flipper Left"
          event="flipper:left"
          color="cyan"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="Flipper Right ►"
          event="flipper:right"
          color="cyan"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

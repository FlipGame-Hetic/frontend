import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

export function BallSection({ onDispatch }: Props) {
  return (
    <Section title="Ball" color="red">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn label="Plunger" event="ball:plunger" color="red" onDispatch={onDispatch} />
        <CyberBtn
          label="Death / Ball Lost"
          event="ball:death"
          color="red"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

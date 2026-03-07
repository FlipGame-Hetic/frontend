import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

export function SpecialsSection({ onDispatch }: Props) {
  return (
    <Section title="Specials" color="yellow">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn label="Ability" event="player:ability" color="yellow" onDispatch={onDispatch} />
        <CyberBtn label="Tilt Error" event="game:tilt" color="yellow" onDispatch={onDispatch} />
      </div>
    </Section>
  )
}

import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

const BUMPERS = [1, 2, 3] as const

interface Props {
  onDispatch: Dispatcher
}

export function BumperSection({ onDispatch }: Props) {
  return (
    <Section title="Bumpers" color="magenta">
      <div className="grid grid-cols-3 gap-2">
        {BUMPERS.map((id) => (
          <CyberBtn
            key={id}
            label={`Bumper ${String(id)}`}
            event="bumper:hit"
            payload={{ id }}
            color="magenta"
            onDispatch={onDispatch}
          />
        ))}
      </div>
    </Section>
  )
}

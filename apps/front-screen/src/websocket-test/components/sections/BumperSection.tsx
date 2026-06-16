import CyberBtn from "@/websocket-test/components/CyberBtn"
import Section from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

const BUMPERS = [1, 2, 3] as const

interface Props {
  onDispatch: Dispatcher
}

const BumperSection = ({ onDispatch }: Props) => {
  return (
    <Section title="Bumpers" color="magenta">
      <div className="grid grid-cols-3 gap-2">
        {BUMPERS.map((id) => (
          <CyberBtn
            key={id}
            label={`Bumper ${String(id)}`}
            event="BallHit"
            payload={{ hits: [{ id: `bumper_${String(id)}`, type: "bumper", force: 1.0 }] }}
            color="magenta"
            onDispatch={onDispatch}
          />
        ))}
      </div>
    </Section>
  )
}

export default BumperSection

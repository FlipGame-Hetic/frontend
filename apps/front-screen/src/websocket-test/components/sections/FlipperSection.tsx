import CyberBtn from "@/websocket-test/components/CyberBtn"
import Section from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

const FlipperSection = ({ onDispatch }: Props) => {
  return (
    <Section title="Flippers" color="cyan">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn
          label="◄ Flipper Left"
          event="Command"
          payload={{ cmd: "flipper_left", params: {} }}
          color="cyan"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="Flipper Right ►"
          event="Command"
          payload={{ cmd: "flipper_right", params: {} }}
          color="cyan"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

export default FlipperSection

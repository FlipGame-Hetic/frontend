import CyberBtn from "@/websocket-test/components/CyberBtn"
import Section from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

const SpecialsSection = ({ onDispatch }: Props) => {
  return (
    <Section title="Specials" color="yellow">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn
          label="Ability"
          event="Command"
          payload={{ cmd: "ability", params: {} }}
          color="yellow"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="Tilt Error"
          event="Command"
          payload={{ cmd: "tilt", params: {} }}
          color="yellow"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

export default SpecialsSection

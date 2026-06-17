import CyberBtn from "@/websocket-test/components/CyberBtn"
import Section from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

const BallSection = ({ onDispatch }: Props) => {
  return (
    <Section title="Ball" color="red">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn
          label="Plunger"
          event="Command"
          payload={{ cmd: "plunger_release", params: {} }}
          color="red"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="Death / Ball Lost"
          event="GameState"
          payload={{ state: "ball_lost", ball_number: 1, score: 0, player: 1, total_players: 1 }}
          color="red"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

export default BallSection

import CyberBtn from "@/websocket-test/components/CyberBtn"
import Section from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

const GameSection = ({ onDispatch }: Props) => {
  return (
    <Section title="Game" color="green">
      <div className="grid grid-cols-2 gap-2">
        <CyberBtn
          label="[ Start Game ]"
          event="GameState"
          payload={{ state: "playing", ball_number: 1, score: 0, player: 1, total_players: 1 }}
          color="green"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="[ Game Over ]"
          event="GameState"
          payload={{ state: "game_over", ball_number: 3, score: 0, player: 1, total_players: 1 }}
          color="green"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="[ Attract ]"
          event="GameState"
          payload={{ state: "attract", ball_number: 0, score: 0, player: 1, total_players: 1 }}
          color="green"
          onDispatch={onDispatch}
        />
        <CyberBtn
          label="[ Idle ]"
          event="GameState"
          payload={{ state: "idle", ball_number: 0, score: 0, player: 1, total_players: 1 }}
          color="green"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}

export default GameSection

import { GAME_PHASE } from "@frontend/types"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import IdleScene from "./IdleScene"
import ModeSelectScene from "./ModeSelectScene"
import CreditsScene from "./CreditsScene"
import CharacterSelectScene from "./CharacterSelectScene"
import PlayingScene from "./PlayingScene"
import PausedScene from "./PausedScene"
import GameOverScene from "./GameOverScene"

const assertNever = (phase: never): never => {
  throw new Error(`Unhandled phase: ${String(phase)}`)
}

export default function SceneRouter() {
  const phase = useBackScreenStore((s) => s.phase)
  const creditsActive = useBackScreenStore((s) => s.creditsActive)

  switch (phase) {
    case GAME_PHASE.Idle:
      return <IdleScene />
    case GAME_PHASE.ModeSelect:
      return creditsActive ? <CreditsScene /> : <ModeSelectScene />
    case GAME_PHASE.CharacterSelect:
      return <CharacterSelectScene />
    case GAME_PHASE.Playing:
      return <PlayingScene />
    case GAME_PHASE.Paused:
      return <PausedScene />
    case GAME_PHASE.GameOver:
      return <GameOverScene />
    default:
      return assertNever(phase)
  }
}

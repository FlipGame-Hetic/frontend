import { useBackScreenStore } from "@/stores/useBackScreenStore"
import IdleScene from "./IdleScene"
import ModeSelectScene from "./ModeSelectScene"
import CharacterSelectScene from "./CharacterSelectScene"
import GameplayHud from "./GameplayHud"
import PausedScene from "./PausedScene"
import GameOverScene from "./GameOverScene"

export default function SceneRouter() {
  const phase = useBackScreenStore((s) => s.phase)

  switch (phase) {
    case "mode_select":
      return <ModeSelectScene />
    case "character_select":
      return <CharacterSelectScene />
    case "playing":
      return <GameplayHud />
    case "paused":
      return <PausedScene />
    case "game_over":
      return <GameOverScene />
    case "idle":
    default:
      return <IdleScene />
  }
}

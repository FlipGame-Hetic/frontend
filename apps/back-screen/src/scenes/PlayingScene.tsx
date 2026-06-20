import { useBackScreenStore } from "@/stores/useBackScreenStore"
import GameplayHud from "./GameplayHud"
import BossScene from "./BossScene"
import BossWarning from "./BossWarning"

export default function PlayingScene() {
  const bossActive = useBackScreenStore((s) => s.bossActive)
  const bossReady = useBackScreenStore((s) => s.bossReady)

  return (
    <div className="relative h-full w-full">
      <GameplayHud />
      {bossActive && <BossScene />}
      {bossActive && !bossReady && <BossWarning />}
    </div>
  )
}

import { useBackScreenStore } from "@/stores/useBackScreenStore"
import GameplayHud from "./GameplayHud"
import BossScene from "./BossScene"

export default function PlayingScene() {
  const bossActive = useBackScreenStore((s) => s.bossActive)

  return (
    <div className="relative h-full w-full">
      <GameplayHud />
      {bossActive && <BossScene />}
    </div>
  )
}

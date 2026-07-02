import { useEffect } from "react"
import { warmBossClips } from "@/boss/bossVideoPreload"
import { RetroBackground } from "@/components/RetroBackground"
import { useKeyboardInput } from "@/hooks/useKeyboardInput"
import { useScreenHubClient } from "@/hooks/useScreenHubClient"
import SceneRouter from "@/scenes/SceneRouter"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { GAME_PHASE } from "@frontend/types"
import { ConnectionOverlay } from "@frontend/ui"

function App() {
  const hubStatus = useScreenHubClient()
  useKeyboardInput()

  // warm boss clips into blob URLs so first boss reveal has no fetch/decoder hitch
  useEffect(() => {
    warmBossClips()
  }, [])

  const phase = useBackScreenStore((s) => s.phase)

  const accentColor = phase === GAME_PHASE.GameOver ? "#C5003C" : "#F3E600"
  const withBlur = phase === GAME_PHASE.Paused || phase === GAME_PHASE.GameOver

  return (
    <div className="bg-arcade-black relative flex h-screen w-screen overflow-hidden">
      <RetroBackground accentColor={accentColor} withBlur={withBlur} />
      <div className="relative z-10 flex h-full w-full">
        <div className="relative min-w-0 flex-1">
          <SceneRouter />
        </div>
      </div>
      <ConnectionOverlay status={hubStatus} />
    </div>
  )
}

export default App

import { button, useControls } from "leva"
import { useEffect, useRef, type ReactNode } from "react"
import { runtimeEnvironment } from "@/config/runtimeEnvironment"
import { requestFrontScreenStartGame } from "@/hooks/useScreenHub"
import useMultiballStore from "@/stores/useMultiballStore"
import useBallStore from "@/stores/useBallStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"
import { playSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import {
  BONUS_ZONE_BOUNCE_THRESHOLD,
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_BALL_COUNT,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "@/components/playfield/bonusZoneConfig"
import { DebugContext, type DebugControls } from "@/debug/debugContext"
import { getDebugBallId } from "@/debug/getDebugBallId"

const DebugProvider = ({ children }: { children: ReactNode }) => {
  const ballCountRef = useRef(MULTIBALL_BALL_COUNT)

  const mainControls = useControls(
    "Main",
    {
      enabled: { value: !runtimeEnvironment.isProduction, label: "Orbit controls" },
      autoMode: false,
      "Start Game": button(requestFrontScreenStartGame),
    },
    { order: 0 },
  )

  const [multiballControls] = useControls(
    "Multiball",
    () => ({
      bounceThreshold: {
        value: BONUS_ZONE_BOUNCE_THRESHOLD,
        min: 1,
        max: 30,
        step: 1,
        label: "Hits needed",
      },
      ballCount: {
        value: MULTIBALL_BALL_COUNT,
        min: 1,
        max: 6,
        step: 1,
        label: "Balls at jackpot",
      },
      "Trigger Multiball": button(() => {
        playSfx("multiball_triggered")
        broadcastEvent({
          event_type: "MultiballTriggered",
          payload: { ball_id: getDebugBallId() },
        })
        useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.multiballTrigger)
        useMultiballStore.getState().reset()
        const count = ballCountRef.current
        for (let i = 0; i < count; i++) {
          setTimeout(
            () => {
              const pos =
                Math.random() < 0.5 ? MULTIBALL_SPAWN_POSITION1 : MULTIBALL_SPAWN_POSITION2
              useBallStore.getState().spawnBall(pos, { isPlaying: true })
            },
            (i + 1) * BONUS_ZONE_SPAWN_INTERVAL_MS,
          )
        }
      }),
    }),
    { order: 2 },
  )

  useEffect(() => {
    ballCountRef.current = multiballControls.ballCount
  }, [multiballControls.ballCount])

  const value: DebugControls = { ...mainControls, ...multiballControls }

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
}

export default DebugProvider

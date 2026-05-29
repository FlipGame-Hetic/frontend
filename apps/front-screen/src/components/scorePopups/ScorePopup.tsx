import { Billboard, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group } from "three"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import {
  SCORE_POPUP_DURATION,
  SCORE_POPUP_FADE_IN,
  SCORE_POPUP_FADE_OUT_START,
  SCORE_POPUP_FONT,
  SCORE_POPUP_FONT_SIZE,
  SCORE_POPUP_OUTLINE_COLOR,
  SCORE_POPUP_OUTLINE_WIDTH,
  SCORE_POPUP_RISE_HEIGHT,
  SCORE_POPUP_Y_OFFSET,
  getScorePopupColor,
} from "./scorePopupConfig"

interface ScorePopupProps {
  id: number
  amount: number
  position: { x: number; y: number; z: number }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const ScorePopup = ({ id, amount, position }: ScorePopupProps) => {
  const groupRef = useRef<Group>(null)
  const startTime = useRef<number | null>(null)
  const color = getScorePopupColor(amount)

  useFrame(() => {
    if (!groupRef.current) return
    startTime.current ??= performance.now()

    const elapsed = (performance.now() - startTime.current) / 1000
    const progress = elapsed / SCORE_POPUP_DURATION

    if (progress >= 1) {
      useScorePopupsStore.getState().removePopup(id)
      return
    }

    groupRef.current.position.set(
      position.x,
      position.y + SCORE_POPUP_Y_OFFSET + easeOutCubic(progress) * SCORE_POPUP_RISE_HEIGHT,
      position.z,
    )

    let opacity: number
    if (progress < SCORE_POPUP_FADE_IN) {
      opacity = progress / SCORE_POPUP_FADE_IN
    } else if (progress > SCORE_POPUP_FADE_OUT_START) {
      opacity = 1 - (progress - SCORE_POPUP_FADE_OUT_START) / (1 - SCORE_POPUP_FADE_OUT_START)
    } else {
      opacity = 1
    }

    groupRef.current.traverse((child) => {
      if ("material" in child) {
        const mat = (child as { material?: { opacity?: number } }).material
        if (mat) mat.opacity = opacity
      }
    })
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + SCORE_POPUP_Y_OFFSET, position.z]}>
      <Billboard>
        <Text
          font={SCORE_POPUP_FONT}
          fontSize={SCORE_POPUP_FONT_SIZE}
          color={color}
          outlineWidth={SCORE_POPUP_OUTLINE_WIDTH}
          outlineColor={SCORE_POPUP_OUTLINE_COLOR}
          renderOrder={999}
          material-transparent
          material-depthWrite={false}
          fillOpacity={1}
          outlineOpacity={1}
        >
          {`+${String(amount)}`}
        </Text>
      </Billboard>
    </group>
  )
}

export default ScorePopup

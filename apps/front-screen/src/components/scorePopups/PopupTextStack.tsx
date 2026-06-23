import { Billboard } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useRef } from "react"
import type { RefObject } from "react"
import type { Group, Object3D } from "three"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import {
  SCORE_POPUP_FADE_IN,
  SCORE_POPUP_GLITCH_DURATION,
  SCORE_POPUP_GLITCH_HOLD,
  SCORE_POPUP_GLITCH_JITTER,
  SCORE_POPUP_GLITCH_SPLIT,
  SCORE_POPUP_GLITCH_STEP_RATE,
  SCORE_POPUP_SHADOW_BLACK,
  SCORE_POPUP_SHADOW_CYAN,
  SCORE_POPUP_SHADOW_RED,
  SCORE_POPUP_Y_OFFSET,
} from "./scorePopupConfig"
import { easeOutCubic } from "@/utils/easing"
import PopupTextLayer from "./PopupTextLayer"
import { setTextMaterialOpacity, signedNoise } from "./popupTextMaterial"

interface Position {
  x: number
  y: number
  z: number
}

interface PopupTextStackProps {
  id: number
  color: string
  duration: number
  fadeOutStart: number
  fillOpacity: number
  position: Position
  riseHeight: number
  shouldGlitch: boolean
  text: string
  getScale?: (progress: number) => number
}

type Offset = readonly [number, number, number]

const setLayerPosition = (ref: RefObject<Group | null>, offset: Offset, x = 0, y = 0) => {
  ref.current?.position.set(offset[0] + x, offset[1] + y, offset[2])
}

const hasMaterial = (child: Object3D): boolean => {
  return "material" in child && Boolean((child as { material?: unknown }).material)
}

const getGlitchStrength = (elapsed: number): number => {
  if (elapsed <= SCORE_POPUP_GLITCH_HOLD) return 1

  const decayDuration = Math.max(0.001, SCORE_POPUP_GLITCH_DURATION - SCORE_POPUP_GLITCH_HOLD)
  return Math.max(0, 1 - (elapsed - SCORE_POPUP_GLITCH_HOLD) / decayDuration)
}

const PopupTextStack = ({
  id,
  color,
  duration,
  fadeOutStart,
  fillOpacity,
  position,
  riseHeight,
  shouldGlitch,
  text,
  getScale,
}: PopupTextStackProps) => {
  const groupRef = useRef<Group>(null)
  const mainTextRef = useRef<Group>(null)
  const redShadowRef = useRef<Group>(null)
  const cyanShadowRef = useRef<Group>(null)
  const blackShadowRef = useRef<Group>(null)
  const startTime = useRef<number | null>(null)
  const textObjectsRef = useRef<Object3D[]>([])

  const collectTextObjects = useCallback(() => {
    const root = groupRef.current
    if (!root) return

    const textObjects: Object3D[] = []
    root.traverse((child) => {
      if (hasMaterial(child)) textObjects.push(child)
    })
    textObjectsRef.current = textObjects
  }, [])

  useEffect(() => {
    collectTextObjects()
    const frame = requestAnimationFrame(collectTextObjects)
    return () => {
      cancelAnimationFrame(frame)
      textObjectsRef.current = []
    }
  }, [collectTextObjects])

  useFrame(() => {
    if (!groupRef.current) return
    startTime.current ??= performance.now()

    const elapsed = (performance.now() - startTime.current) / 1000
    const progress = elapsed / duration
    const glitchStrength = shouldGlitch ? getGlitchStrength(elapsed) : 0
    const glitchStep = Math.floor(elapsed * SCORE_POPUP_GLITCH_STEP_RATE)

    if (progress >= 1) {
      useScorePopupsStore.getState().removePopup(id)
      return
    }

    groupRef.current.position.set(
      position.x,
      position.y + SCORE_POPUP_Y_OFFSET + easeOutCubic(progress) * riseHeight,
      position.z,
    )

    let opacity: number
    if (progress < SCORE_POPUP_FADE_IN) {
      opacity = progress / SCORE_POPUP_FADE_IN
    } else if (progress > fadeOutStart) {
      opacity = 1 - (progress - fadeOutStart) / (1 - fadeOutStart)
    } else {
      opacity = 1
    }

    const jitterX =
      signedNoise(id * 17 + glitchStep * 3) * SCORE_POPUP_GLITCH_JITTER * glitchStrength
    const jitterY =
      signedNoise(id * 23 + glitchStep * 5) * SCORE_POPUP_GLITCH_JITTER * 0.65 * glitchStrength
    const stretchNoise = Math.max(0, signedNoise(id * 31 + glitchStep * 7))
    const split = SCORE_POPUP_GLITCH_SPLIT * glitchStrength
    const scale = getScale?.(progress) ?? 1

    setLayerPosition(mainTextRef, [0, 0, 0], jitterX * 0.42, jitterY * 0.42)
    mainTextRef.current?.scale.set(
      scale * (1 + stretchNoise * 0.16 * glitchStrength),
      scale * (1 - stretchNoise * 0.08 * glitchStrength),
      1,
    )
    setLayerPosition(redShadowRef, SCORE_POPUP_SHADOW_RED.offset, split + jitterX, jitterY)
    setLayerPosition(
      cyanShadowRef,
      SCORE_POPUP_SHADOW_CYAN.offset,
      -split - jitterX,
      -jitterY * 0.7,
    )
    setLayerPosition(
      blackShadowRef,
      SCORE_POPUP_SHADOW_BLACK.offset,
      jitterX * 0.25,
      jitterY * 0.25,
    )

    if (textObjectsRef.current.length === 0) collectTextObjects()

    for (const child of textObjectsRef.current) {
      setTextMaterialOpacity(child, opacity, glitchStrength, glitchStep, id)
    }
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + SCORE_POPUP_Y_OFFSET, position.z]}>
      <Billboard>
        <group ref={blackShadowRef} position={[...SCORE_POPUP_SHADOW_BLACK.offset]}>
          <PopupTextLayer
            color={SCORE_POPUP_SHADOW_BLACK.color}
            opacity={SCORE_POPUP_SHADOW_BLACK.opacity}
            renderOrder={996}
            role="black"
          >
            {text}
          </PopupTextLayer>
        </group>
        <group ref={redShadowRef} position={[...SCORE_POPUP_SHADOW_RED.offset]}>
          <PopupTextLayer
            color={SCORE_POPUP_SHADOW_RED.color}
            opacity={SCORE_POPUP_SHADOW_RED.opacity}
            renderOrder={997}
            role="red"
          >
            {text}
          </PopupTextLayer>
        </group>
        <group ref={cyanShadowRef} position={[...SCORE_POPUP_SHADOW_CYAN.offset]}>
          <PopupTextLayer
            color={SCORE_POPUP_SHADOW_CYAN.color}
            opacity={SCORE_POPUP_SHADOW_CYAN.opacity}
            renderOrder={998}
            role="cyan"
          >
            {text}
          </PopupTextLayer>
        </group>
        <group ref={mainTextRef}>
          <PopupTextLayer color={color} opacity={fillOpacity} renderOrder={999} role="main">
            {text}
          </PopupTextLayer>
        </group>
      </Billboard>
    </group>
  )
}

export default PopupTextStack

import { Billboard, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { RefObject } from "react"
import type { Group, Material, Object3D } from "three"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import {
  SCORE_POPUP_DURATION,
  SCORE_POPUP_FADE_IN,
  SCORE_POPUP_FADE_OUT_START,
  SCORE_POPUP_FONT,
  SCORE_POPUP_FONT_SIZE,
  SCORE_POPUP_GLITCH_DURATION,
  SCORE_POPUP_GLITCH_HOLD,
  SCORE_POPUP_GLITCH_JITTER,
  SCORE_POPUP_GLITCH_SPLIT,
  SCORE_POPUP_GLITCH_STEP_RATE,
  SCORE_POPUP_GLITCH_THRESHOLD,
  SCORE_POPUP_LETTER_SPACING,
  SCORE_POPUP_OUTLINE_COLOR,
  SCORE_POPUP_OUTLINE_WIDTH,
  SCORE_POPUP_RISE_HEIGHT,
  SCORE_POPUP_SHADOW_BLACK,
  SCORE_POPUP_SHADOW_CYAN,
  SCORE_POPUP_SHADOW_RED,
  SCORE_POPUP_Y_OFFSET,
  getScorePopupFillOpacity,
  getScorePopupColor,
} from "./scorePopupConfig"

interface ScorePopupProps {
  id: number
  amount: number
  position: { x: number; y: number; z: number }
  color: string
}

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

type ScorePopupLayerRole = "main" | "red" | "cyan" | "black"
type Offset = readonly [number, number, number]
type TextObject = Object3D & { material?: Material | Material[] }

const signedNoise = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const setLayerPosition = (ref: RefObject<Group | null>, offset: Offset, x = 0, y = 0) => {
  ref.current?.position.set(offset[0] + x, offset[1] + y, offset[2])
}

const getGlitchStrength = (elapsed: number): number => {
  if (elapsed <= SCORE_POPUP_GLITCH_HOLD) return 1

  const decayDuration = Math.max(0.001, SCORE_POPUP_GLITCH_DURATION - SCORE_POPUP_GLITCH_HOLD)
  return Math.max(0, 1 - (elapsed - SCORE_POPUP_GLITCH_HOLD) / decayDuration)
}

const getLayerGlitchOpacity = (
  role: ScorePopupLayerRole,
  strength: number,
  step: number,
  id: number,
): number => {
  if (strength <= 0) return 1

  const pulse = Math.max(0, signedNoise(id * 29 + step * 11))
  if (role === "main") return Math.max(0.68, 1 - pulse * 0.32 * strength)
  if (role === "black") return 1

  return Math.min(2.1, 1 + (0.85 + pulse * 0.75) * strength)
}

const setTextMaterialOpacity = (
  child: Object3D,
  fadeOpacity: number,
  glitchStrength: number,
  glitchStep: number,
  id: number,
) => {
  const material = (child as TextObject).material
  if (!material) return

  const baseOpacity =
    typeof child.userData.scorePopupOpacity === "number" ? child.userData.scorePopupOpacity : 1
  const role =
    typeof child.userData.scorePopupRole === "string"
      ? (child.userData.scorePopupRole as ScorePopupLayerRole)
      : "main"
  const opacity = clamp01(
    fadeOpacity * baseOpacity * getLayerGlitchOpacity(role, glitchStrength, glitchStep, id),
  )

  const materials = Array.isArray(material) ? material : [material]
  for (const mat of materials) {
    mat.transparent = true
    mat.opacity = opacity
  }
}

interface ScorePopupTextLayerProps {
  children: string
  color: string
  opacity: number
  renderOrder: number
  role: ScorePopupLayerRole
}

const ScorePopupTextLayer = ({
  children,
  color,
  opacity,
  renderOrder,
  role,
}: ScorePopupTextLayerProps) => {
  return (
    <Text
      font={SCORE_POPUP_FONT}
      fontSize={SCORE_POPUP_FONT_SIZE}
      letterSpacing={SCORE_POPUP_LETTER_SPACING}
      color={color}
      outlineWidth={SCORE_POPUP_OUTLINE_WIDTH}
      outlineColor={SCORE_POPUP_OUTLINE_COLOR}
      renderOrder={renderOrder}
      userData={{ scorePopupOpacity: opacity, scorePopupRole: role }}
      material-transparent
      material-depthWrite={false}
      fillOpacity={1}
      outlineOpacity={0}
    >
      {children}
    </Text>
  )
}

const ScorePopup = ({ id, amount, position, color: targetColor }: ScorePopupProps) => {
  const groupRef = useRef<Group>(null)
  const mainTextRef = useRef<Group>(null)
  const redShadowRef = useRef<Group>(null)
  const cyanShadowRef = useRef<Group>(null)
  const blackShadowRef = useRef<Group>(null)
  const startTime = useRef<number | null>(null)
  const color = getScorePopupColor(amount, targetColor)
  const fillOpacity = getScorePopupFillOpacity(amount)
  const amountText = amount.toString()
  const text = amount >= 0 ? `+${amountText}` : amountText

  useFrame(() => {
    if (!groupRef.current) return
    startTime.current ??= performance.now()

    const elapsed = (performance.now() - startTime.current) / 1000
    const progress = elapsed / SCORE_POPUP_DURATION
    const shouldGlitch = amount >= SCORE_POPUP_GLITCH_THRESHOLD
    const glitchStrength = shouldGlitch ? getGlitchStrength(elapsed) : 0
    const glitchStep = Math.floor(elapsed * SCORE_POPUP_GLITCH_STEP_RATE)

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

    const jitterX =
      signedNoise(id * 17 + glitchStep * 3) * SCORE_POPUP_GLITCH_JITTER * glitchStrength
    const jitterY =
      signedNoise(id * 23 + glitchStep * 5) * SCORE_POPUP_GLITCH_JITTER * 0.65 * glitchStrength
    const stretchNoise = Math.max(0, signedNoise(id * 31 + glitchStep * 7))
    const split = SCORE_POPUP_GLITCH_SPLIT * glitchStrength

    setLayerPosition(mainTextRef, [0, 0, 0], jitterX * 0.42, jitterY * 0.42)
    mainTextRef.current?.scale.set(
      1 + stretchNoise * 0.16 * glitchStrength,
      1 - stretchNoise * 0.08 * glitchStrength,
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

    groupRef.current.traverse((child) => {
      setTextMaterialOpacity(child, opacity, glitchStrength, glitchStep, id)
    })
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + SCORE_POPUP_Y_OFFSET, position.z]}>
      <Billboard>
        <group ref={blackShadowRef} position={[...SCORE_POPUP_SHADOW_BLACK.offset]}>
          <ScorePopupTextLayer
            color={SCORE_POPUP_SHADOW_BLACK.color}
            opacity={SCORE_POPUP_SHADOW_BLACK.opacity}
            renderOrder={996}
            role="black"
          >
            {text}
          </ScorePopupTextLayer>
        </group>
        <group ref={redShadowRef} position={[...SCORE_POPUP_SHADOW_RED.offset]}>
          <ScorePopupTextLayer
            color={SCORE_POPUP_SHADOW_RED.color}
            opacity={SCORE_POPUP_SHADOW_RED.opacity}
            renderOrder={997}
            role="red"
          >
            {text}
          </ScorePopupTextLayer>
        </group>
        <group ref={cyanShadowRef} position={[...SCORE_POPUP_SHADOW_CYAN.offset]}>
          <ScorePopupTextLayer
            color={SCORE_POPUP_SHADOW_CYAN.color}
            opacity={SCORE_POPUP_SHADOW_CYAN.opacity}
            renderOrder={998}
            role="cyan"
          >
            {text}
          </ScorePopupTextLayer>
        </group>
        <group ref={mainTextRef}>
          <ScorePopupTextLayer color={color} opacity={fillOpacity} renderOrder={999} role="main">
            {text}
          </ScorePopupTextLayer>
        </group>
      </Billboard>
    </group>
  )
}

export default ScorePopup

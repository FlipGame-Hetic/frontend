import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useState, type CSSProperties, type ReactNode } from "react"
import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import { runtimeEnvironment } from "@/config/runtimeEnvironment"
import {
  CONTROL_HINTS_CONFIG,
  CONTROL_HINT_LABELS,
  type ControlHintPlacement,
} from "@/config/controlHintsConfig"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { getPressedKeys } from "@/stores/inputStore"
import useGameStore from "@/stores/useGameStore"

const FLIPPER_KEYS = [...LEFT_KEYS, ...RIGHT_KEYS]
const isCabinet = runtimeEnvironment.isProductionCabinet
const labels = isCabinet ? CONTROL_HINT_LABELS.cabinet : CONTROL_HINT_LABELS.browser
const placementKey = isCabinet ? "cabinet" : "browser"

const wordsNode = (words: readonly string[]): ReactNode => (
  <div className="control-hint">
    {words.map((word) => (
      <span key={word} className="control-hint__word">
        {word}
      </span>
    ))}
  </div>
)

const flipperNode = (side: "left" | "right"): ReactNode => {
  if (isCabinet) return wordsNode(side === "left" ? labels.flipperLeft : labels.flipperRight)
  return <div className={`control-hint-arrow control-hint-arrow--${side}`} aria-hidden="true" />
}

const ControlHints = () => {
  const phase = useGameStore((state) => state.phase)
  const selectedPlayers = useGameStore((state) => state.selectedPlayers)
  const currentPlayer = useGameStore((state) => state.currentPlayer)
  const [plungerHidden, setPlungerHidden] = useState(false)
  const [flippersHidden, setFlippersHidden] = useState(false)
  const wasPlayingRef = useRef(false)

  useFrame(() => {
    if (phase !== "playing") {
      wasPlayingRef.current = false
      return
    }
    if (!wasPlayingRef.current) {
      wasPlayingRef.current = true
      setPlungerHidden(false)
      setFlippersHidden(false)
      return
    }
    const keys = getPressedKeys()
    if (!plungerHidden && keys.has(PLUNGER_KEY)) setPlungerHidden(true)
    if (!flippersHidden && FLIPPER_KEYS.some((key) => keys.has(key))) setFlippersHidden(true)
  })

  if (phase !== "playing") return null

  const character =
    selectedPlayers.find((player) => player.player === currentPlayer)?.character ??
    DEFAULT_CHARACTER.id
  const color = (
    CHARACTER_OPTIONS.find((option) => option.id === character) ?? CHARACTER_OPTIONS[0]
  ).color
  const wrapStyle = { "--control-hint-color": color } as CSSProperties

  const hints: { key: string; placement: ControlHintPlacement; node: ReactNode }[] = []

  if (!plungerHidden) {
    hints.push({
      key: "plunger",
      placement: CONTROL_HINTS_CONFIG.plunger,
      node: wordsNode(labels.plunger),
    })
  }

  if (!flippersHidden) {
    hints.push({
      key: "flipperLeft",
      placement: CONTROL_HINTS_CONFIG.flipperLeft,
      node: flipperNode("left"),
    })
    hints.push({
      key: "flipperRight",
      placement: CONTROL_HINTS_CONFIG.flipperRight,
      node: flipperNode("right"),
    })
  }

  return (
    <>
      {hints.map((hint) => (
        <group key={hint.key} position={[...hint.placement.position[placementKey]]}>
          <Html
            center
            distanceFactor={hint.placement.distanceFactor}
            sprite
            transform
            zIndexRange={[900, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="control-hint-wrap" style={wrapStyle}>
              {hint.node}
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}

export default ControlHints

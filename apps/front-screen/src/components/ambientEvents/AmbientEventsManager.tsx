import useGameStore from "@/stores/useGameStore"
import { GAME_PHASE } from "@frontend/types"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { button, useControls } from "leva"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import type { FC } from "react"
import {
  AMBIENT_EVENT_IDS,
  AMBIENT_MODEL_URLS,
  type AmbientEventAtomProps,
  type AmbientEventId,
  type AmbientEventInstance,
  type AmbientEventType,
} from "./ambientEventsConfig"
import {
  buildEventInstance,
  buildEventInstanceFor,
  computeNextDelayMs,
} from "./ambientEventScheduler"
import FlyingCarEvent from "./FlyingCarEvent"
import HolocronEvent from "./HolocronEvent"

// Preload every prop so the first (rare) apparition doesn't hitch the frame
for (const url of Object.values(AMBIENT_MODEL_URLS)) {
  useGLTF.preload(url)
}

// Type-to-atom dispatch table : adding a prop type is one entry, no switch
const AMBIENT_EVENT_COMPONENTS: Record<AmbientEventType, FC<AmbientEventAtomProps>> = {
  holocron: HolocronEvent,
  car: FlyingCarEvent,
}

interface ActiveRun {
  instance: AmbientEventInstance
  runId: number
}

const AmbientEventsManager = () => {
  const [active, setActive] = useState<ActiveRun | null>(null)
  const remainingMsRef = useRef(computeNextDelayMs())
  const previousIdRef = useRef<AmbientEventId | null>(null)
  const activeRef = useRef(false)
  const runCounterRef = useRef(0)

  const start = useCallback((instance: AmbientEventInstance) => {
    if (activeRef.current) return
    previousIdRef.current = instance.id
    activeRef.current = true
    runCounterRef.current += 1
    setActive({ instance, runId: runCounterRef.current })
  }, [])

  const handleComplete = useCallback(() => {
    activeRef.current = false
    remainingMsRef.current = computeNextDelayMs()
    setActive(null)
  }, [])

  // Debug : force apparitions on demand (Leva is hidden in production), since real events are intentionally rare
  useControls("Ambient events", () => ({
    "Trigger random": button(() => {
      start(buildEventInstance(previousIdRef.current))
    }),
    ...Object.fromEntries(
      AMBIENT_EVENT_IDS.map((id) => [
        `Trigger ${id}`,
        button(() => {
          start(buildEventInstanceFor(id))
        }),
      ]),
    ),
  }))

  // Countdown only advances while playing, so pause naturally freezes scheduling
  useFrame((_, delta) => {
    if (activeRef.current) return
    if (useGameStore.getState().phase !== GAME_PHASE.Playing) return
    remainingMsRef.current -= delta * 1000
    if (remainingMsRef.current > 0) return
    start(buildEventInstance(previousIdRef.current))
  })

  // Clean reset when the game ends or returns to menus (pause is left untouched to keep any in-flight prop)
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.phase === prev.phase) return
      if (state.phase === GAME_PHASE.Playing || state.phase === GAME_PHASE.Paused) return
      activeRef.current = false
      remainingMsRef.current = computeNextDelayMs()
      previousIdRef.current = null
      setActive(null)
    })
  }, [])

  if (!active) return null

  const EventComponent = AMBIENT_EVENT_COMPONENTS[active.instance.def.type]
  return (
    <Suspense fallback={null}>
      <EventComponent key={active.runId} instance={active.instance} onComplete={handleComplete} />
    </Suspense>
  )
}

export default AmbientEventsManager

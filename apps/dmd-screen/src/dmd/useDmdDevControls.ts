import { useMemo } from "react"
import { useControls } from "leva"
import { GAME_PHASE } from "@frontend/types"
import type { GamePhase } from "@frontend/types"
import { DEFAULT_DMD_CONFIG } from "./config"
import type { DmdConfig } from "./config"

// "— live —" (null) follows the websocket-driven phase; selecting a phase overrides it
const SCENE_OPTIONS: Record<string, GamePhase | null> = {
  "— live —": null,
  ...Object.fromEntries(Object.values(GAME_PHASE).map((phase) => [phase, phase])),
}

export interface DmdDevControls {
  config: DmdConfig
  devPhase: GamePhase | null
}

export function useDmdDevControls(): DmdDevControls {
  const { scene, cols, dotColor, gapRatio, offOpacity } = useControls({
    scene: { value: null as GamePhase | null, options: SCENE_OPTIONS, label: "Scene" },
    cols: { value: DEFAULT_DMD_CONFIG.cols, min: 64, max: 256, step: 1, label: "Cols" },
    dotColor: { value: DEFAULT_DMD_CONFIG.dotColor, label: "Dot color" },
    gapRatio: { value: DEFAULT_DMD_CONFIG.gapRatio, min: 0, max: 0.5, step: 0.01, label: "Gap" },
    offOpacity: {
      value: DEFAULT_DMD_CONFIG.offOpacity,
      min: 0,
      max: 0.2,
      step: 0.01,
      label: "Ghost",
    },
  })

  // 16:9 aspect — rows derived from cols
  const config = useMemo<DmdConfig>(
    () => ({
      ...DEFAULT_DMD_CONFIG,
      cols,
      rows: Math.round(cols * (9 / 16)),
      dotColor,
      gapRatio,
      offOpacity,
    }),
    [cols, dotColor, gapRatio, offOpacity],
  )

  return { config, devPhase: scene }
}

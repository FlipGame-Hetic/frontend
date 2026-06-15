import type { GameMode } from "@frontend/types"

export { CHARACTER_OPTIONS } from "@frontend/types"

export interface ModeOption {
  id: GameMode
  label: string
  description: string
  locked?: boolean
}

type NonEmptyArray<T> = [T, ...T[]]

export const MODE_OPTIONS: NonEmptyArray<ModeOption> = [
  {
    id: "solo",
    label: "SOLO",
    description: "Une bille. Un joueur. Fais le score.",
  },
  {
    id: "duo",
    label: "DUO",
    description: "Bientôt disponible.",
    locked: true,
  },
  {
    id: "boss",
    label: "BOSS RUSH",
    description: "Bientôt disponible.",
    locked: true,
  },
]

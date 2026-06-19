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
    id: "boss",
    label: "BOSS",
    description: "Affronte les I.A. du flipper. Détruis leur barre de vie avant de perdre.",
  },
  {
    id: "duo",
    label: "DUO",
    description: "Bientôt disponible.",
    locked: true,
  },
]

import type { GameMode } from "@frontend/types"

export { CHARACTER_OPTIONS } from "@frontend/types"

export interface ModeOption {
  id: GameMode | "credits"
  label: string
  description: string
  locked?: boolean
}

type NonEmptyArray<T> = [T, ...T[]]

export const MODE_OPTIONS: NonEmptyArray<ModeOption> = [
  {
    id: "boss",
    label: "SOLO",
    description:
      "Tu as été jeté dans l'arène pour notre amusement. Donne un beau spectacle avant de tomber au combat.",
  },
  {
    id: "duo",
    label: "DUO",
    description: "Bientôt disponible.",
    locked: true,
  },
  {
    id: "credits",
    label: "CRÉDITS",
    description:
      "Le générique de S.P.A.M.E.R : ceux qui ont donné vie à la borne, et les artistes qui nous ont prêté leurs œuvres.",
  },
]

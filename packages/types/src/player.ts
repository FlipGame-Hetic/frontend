import type { CharacterType } from "./character"

export interface Player {
  id: string
  name: string
  character: CharacterType
  hp: number
  score: number
}

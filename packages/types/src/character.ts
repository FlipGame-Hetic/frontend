import type { CharacterType } from "./player"

export interface CharacterConfig {
  id: CharacterType
  label: string
  description: string
  color: string
  gradient: string
  glow: string
  material: string
  locked?: boolean
}

type NonEmptyArray<T> = [T, ...T[]]

export const CHARACTER_OPTIONS: NonEmptyArray<CharacterConfig> = [
  {
    id: "enforcer",
    label: "KEENU",
    description: "On adore regarder des gens comme lui lutter pour leur survie.",
    color: "#FF8C00",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFE070 0%, #FF8C00 30%, #FF4400 65%, #991800 100%)",
    glow: "0 0 20px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.4)",
    material: "#FFAA00",
  },
  {
    id: "viper",
    label: "VIPER",
    description: "Trafiquant d'augmentations illégales. Il vend du rêve aux gosses des rues.",
    color: "#7FFF00",
    gradient:
      "radial-gradient(circle at 36% 32%, #EEFF88 0%, #7FFF00 30%, #3A8800 65%, #0D2200 100%)",
    glow: "0 0 20px rgba(127, 255, 0, 0.8), 0 0 60px rgba(90, 200, 0, 0.4)",
    material: "#7FFF00",
  },
  {
    id: "ghost",
    label: "GHOST",
    description:
      "Elle s'est échappée de la Zone Basse. Il n'a pas fallu longtemps avant qu'on la rattrape.",
    color: "#FF2D78",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFB0CC 0%, #FF2D78 30%, #CC0055 65%, #660033 100%)",
    glow: "0 0 20px rgba(255, 45, 120, 0.8), 0 0 60px rgba(200, 0, 80, 0.4)",
    material: "#FF2D78",
  },
  {
    id: "oracle",
    label: "ORACLE",
    description:
      "Elle voit l'avenir, ce qui rend l'inéluctabilité de son sort encore plus amusante.",
    color: "#E8EEF4",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFFFFF 0%, #E8EEF4 30%, #9AAABB 65%, #3A4A5A 100%)",
    glow: "0 0 20px rgba(232, 238, 244, 0.9), 0 0 60px rgba(180, 200, 220, 0.5)",
    material: "#C8D8E8",
  },
]

export const DEFAULT_CHARACTER: CharacterType = "enforcer"

export type CharacterType = "enforcer" | "viper" | "ghost" | "oracle"

export type UltiId = "multiball_split" | "rampage" | "time_slow" | "mimic"

export type UltiShape = "instant" | "sustained" | "inherited"

export interface UltiPayload {
  multiplier?: number
  slow_factor?: number
}

interface CharacterChargeProfile {
  weight_bumper: number
  weight_rail: number
  weight_combo: number
  weight_other: number
  time_rate: number
}

export interface CharacterGameplay {
  id: CharacterType
  ulti_id: UltiId
  shape: UltiShape
  cancellable?: boolean
  duration_ms?: number
  charge_max: number
  payload?: UltiPayload
  charge_profile: CharacterChargeProfile
}

export interface CharacterConfig {
  id: CharacterType
  label: string
  description: string
  description_ultimate: string
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
    description_ultimate: "Crée un double de lui-même avant de se téléporter en lieu sûr.",
    color: "#FF8C00",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFE070 0%, #FF8C00 30%, #FF4400 65%, #991800 100%)",
    glow: "0 0 20px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.4)",
    material: "#FFAA00",
  },
  {
    id: "viper",
    label: "VIPER",
    description:
      "Trafiquant d'augmentations illégales. Il vend du rêve (et d'autres choses) aux gosses des rues.",
    description_ultimate:
      "S'injecte l'une de ses concoctions pour augmenter sa vitesse et son multiplicateur.",
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
    description_ultimate:
      "Utilise ses talents de hackeuse pour imiter les capacités des autres combattants.",
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
    description_ultimate: "Ses visions du futur lui permettent de ralentir le temps.",
    color: "#E8EEF4",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFFFFF 0%, #E8EEF4 30%, #9AAABB 65%, #3A4A5A 100%)",
    glow: "0 0 20px rgba(232, 238, 244, 0.9), 0 0 60px rgba(180, 200, 220, 0.5)",
    material: "#C8D8E8",
  },
]

export const DEFAULT_CHARACTER: CharacterConfig = CHARACTER_OPTIONS[0]

export const GAMEPLAY_FALLBACK: Record<CharacterType, CharacterGameplay> = {
  enforcer: {
    id: "enforcer",
    ulti_id: "multiball_split",
    shape: "instant",
    cancellable: false,
    charge_max: 320,
    charge_profile: {
      weight_bumper: 1.0,
      weight_rail: 0.3,
      weight_combo: 1.0,
      weight_other: 1.0,
      time_rate: 0.0,
    },
  },
  viper: {
    id: "viper",
    ulti_id: "rampage",
    shape: "sustained",
    cancellable: false,
    duration_ms: 8000,
    charge_max: 360,
    payload: { multiplier: 5.0 },
    charge_profile: {
      weight_bumper: 1.0,
      weight_rail: 1.0,
      weight_combo: 1.0,
      weight_other: 1.0,
      time_rate: 0.0,
    },
  },
  ghost: {
    id: "ghost",
    ulti_id: "mimic",
    shape: "inherited",
    charge_max: 300,
    charge_profile: {
      weight_bumper: 1.0,
      weight_rail: 1.0,
      weight_combo: 1.0,
      weight_other: 1.0,
      time_rate: 0.0,
    },
  },
  oracle: {
    id: "oracle",
    ulti_id: "time_slow",
    shape: "sustained",
    cancellable: true,
    duration_ms: 5000,
    charge_max: 240,
    payload: { slow_factor: 0.25 },
    charge_profile: {
      weight_bumper: 1.0,
      weight_rail: 1.0,
      weight_combo: 1.0,
      weight_other: 1.0,
      time_rate: 1.0,
    },
  },
}

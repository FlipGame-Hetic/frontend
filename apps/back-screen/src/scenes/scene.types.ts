import type { GameMode, CharacterType } from "@frontend/types"

export interface ModeOption {
  id: GameMode
  label: string
  description: string
  locked?: boolean
}

export interface CharacterOption {
  id: CharacterType
  label: string
  description: string
  color: string
  gradient: string
  glow: string
  locked?: boolean
}

export const MODE_OPTIONS: ModeOption[] = [
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

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: "striker",
    label: "ATTAQUANT",
    description: "Frappe fort. Accumule des points.",
    color: "#FF8C00",
    gradient:
      "radial-gradient(circle at 36% 32%, #FFE070 0%, #FF8C00 30%, #FF4400 65%, #991800 100%)",
    glow: "0 0 20px rgba(255, 140, 0, 0.8), 0 0 60px rgba(255, 100, 0, 0.4)",
  },
  {
    id: "defender",
    label: "DÉFENSEUR",
    description: "Contrôle le terrain. Encaisse tout.",
    color: "#0088FF",
    gradient:
      "radial-gradient(circle at 36% 32%, #8CDCFF 0%, #0088FF 30%, #0033CC 65%, #001888 100%)",
    glow: "0 0 20px rgba(0, 136, 255, 0.8), 0 0 60px rgba(0, 80, 200, 0.4)",
    locked: true,
  },
  {
    id: "trickster",
    label: "TROMPEUR",
    description: "Imprévisible. Multiplicateur de score.",
    color: "#00AAAA",
    gradient:
      "radial-gradient(circle at 36% 32%, #C8FFFF 0%, #00FFD4 30%, #00AAAA 65%, #005555 100%)",
    glow: "0 0 20px rgba(0, 200, 200, 0.8), 0 0 60px rgba(0, 150, 150, 0.4)",
    locked: true,
  },
  {
    id: "heavy",
    label: "???",
    description: "Bientôt disponible.",
    color: "#556677",
    gradient:
      "radial-gradient(circle at 36% 32%, #778899 0%, #556677 30%, #334455 65%, #1A2233 100%)",
    glow: "none",
    locked: true,
  },
]

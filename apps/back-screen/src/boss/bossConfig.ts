export type BossRendererKind = "video-shader" | "model"

export interface BossClips {
  idle: string[]
  damage: string[]
}

export interface BossDefinition {
  id: number
  name: string
  renderer: BossRendererKind
  themeColor: string
  clips?: BossClips
  modelSrc?: string
}

export const BOSS_REGISTRY: [BossDefinition, ...BossDefinition[]] = [
  {
    id: 0,
    name: "G.L.A.D.O.S",
    renderer: "video-shader",
    themeColor: "#C5003C",
    clips: {
      idle: ["/videos/bossVideoLoop.webm"],
      damage: [],
    },
  },
]

export function resolveBoss(id: number | null): BossDefinition {
  return BOSS_REGISTRY.find((b) => b.id === id) ?? BOSS_REGISTRY[0]
}

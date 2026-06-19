export type BossRendererKind = "video-shader" | "model"

export interface BossClips {
  idle: string[]
  damage: string[]
  death?: string
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
      idle: ["/videos/boss1/bossVideoLoop.webm"],
      damage: ["/videos/boss1/hurt1.webm", "/videos/boss1/hurt2.webm", "/videos/boss1/hurt3.webm"],
      death: "/videos/boss1/death.webm",
    },
  },
]

export function resolveBoss(id: number | null): BossDefinition {
  return BOSS_REGISTRY.find((b) => b.id === id) ?? BOSS_REGISTRY[0]
}

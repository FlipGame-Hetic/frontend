export interface BossShaderConfig {
  baseColor: [number, number, number]
  damageColor: [number, number, number]
  damageDecaySeconds: number
}

export const BOSS_SHADER_CONFIG: BossShaderConfig = {
  baseColor: [0, 1, 0],
  damageColor: [1, 0, 0],
  damageDecaySeconds: 0.6,
}

export interface DmdConfig {
  cols: number
  rows: number
  dotColor: string
  bgColor: string
  offOpacity: number
  gapRatio: number
}

export const DEFAULT_DMD_CONFIG: DmdConfig = {
  cols: 128,
  rows: 72,
  dotColor: "#FFFFFF",
  bgColor: "#000000",
  offOpacity: 0.05,
  gapRatio: 0.2,
}

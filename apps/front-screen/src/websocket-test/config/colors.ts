import type { Color } from "../types"

export interface ColorConfig {
  border: string
  text: string
  hover: string
  textGlow: string
  btnShadow: string
  sectionShadow: string
}

export const colors: Record<Color, ColorConfig> = {
  cyan: {
    border: "border-cyan-400",
    text: "text-cyan-400",
    hover: "hover:bg-cyan-400/10",
    textGlow: "[text-shadow:0_0_8px_#22d3ee]",
    btnShadow: "shadow-[0_0_6px_#22d3ee33,inset_0_0_6px_#22d3ee11]",
    sectionShadow: "shadow-[0_0_8px_#22d3ee22]",
  },
  magenta: {
    border: "border-fuchsia-400",
    text: "text-fuchsia-400",
    hover: "hover:bg-fuchsia-400/10",
    textGlow: "[text-shadow:0_0_8px_#e879f9]",
    btnShadow: "shadow-[0_0_6px_#e879f933,inset_0_0_6px_#e879f911]",
    sectionShadow: "shadow-[0_0_8px_#e879f922]",
  },
  green: {
    border: "border-emerald-400",
    text: "text-emerald-400",
    hover: "hover:bg-emerald-400/10",
    textGlow: "[text-shadow:0_0_8px_#34d399]",
    btnShadow: "shadow-[0_0_6px_#34d39933,inset_0_0_6px_#34d39911]",
    sectionShadow: "shadow-[0_0_8px_#34d39922]",
  },
  red: {
    border: "border-red-400",
    text: "text-red-400",
    hover: "hover:bg-red-400/10",
    textGlow: "[text-shadow:0_0_8px_#f87171]",
    btnShadow: "shadow-[0_0_6px_#f8717133,inset_0_0_6px_#f8717111]",
    sectionShadow: "shadow-[0_0_8px_#f8717122]",
  },
  yellow: {
    border: "border-yellow-400",
    text: "text-yellow-400",
    hover: "hover:bg-yellow-400/10",
    textGlow: "[text-shadow:0_0_8px_#facc15]",
    btnShadow: "shadow-[0_0_6px_#facc1533,inset_0_0_6px_#facc1511]",
    sectionShadow: "shadow-[0_0_8px_#facc1522]",
  },
  purple: {
    border: "border-violet-400",
    text: "text-violet-400",
    hover: "hover:bg-violet-400/10",
    textGlow: "[text-shadow:0_0_8px_#a78bfa]",
    btnShadow: "shadow-[0_0_6px_#a78bfa33,inset_0_0_6px_#a78bfa11]",
    sectionShadow: "shadow-[0_0_8px_#a78bfa22]",
  },
}

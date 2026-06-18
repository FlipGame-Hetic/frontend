import type { Material, Object3D } from "three"

export type PopupTextLayerRole = "main" | "red" | "cyan" | "black"

type TextObject = Object3D & { material?: Material | Material[] }

export const signedNoise = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const getLayerGlitchOpacity = (
  role: PopupTextLayerRole,
  strength: number,
  step: number,
  id: number,
): number => {
  if (strength <= 0) return 1

  const pulse = Math.max(0, signedNoise(id * 29 + step * 11))
  if (role === "main") return Math.max(0.68, 1 - pulse * 0.32 * strength)
  if (role === "black") return 1

  return Math.min(2.1, 1 + (0.85 + pulse * 0.75) * strength)
}

export const setTextMaterialOpacity = (
  child: Object3D,
  fadeOpacity: number,
  glitchStrength: number,
  glitchStep: number,
  id: number,
) => {
  const material = (child as TextObject).material
  if (!material) return

  const baseOpacity =
    typeof child.userData.scorePopupOpacity === "number" ? child.userData.scorePopupOpacity : 1
  const role =
    typeof child.userData.scorePopupRole === "string"
      ? (child.userData.scorePopupRole as PopupTextLayerRole)
      : "main"
  const opacity = clamp01(
    fadeOpacity * baseOpacity * getLayerGlitchOpacity(role, glitchStrength, glitchStep, id),
  )

  const materials = Array.isArray(material) ? material : [material]
  for (const mat of materials) {
    mat.transparent = true
    mat.opacity = opacity
  }
}

import type { ColorRepresentation, Material } from "three"
import { Color } from "three"

interface EmissiveMaterial extends Material {
  emissive: Color
  emissiveIntensity: number
}

export interface BloomMaterialOptions {
  emissiveIntensity: number
  emissiveColor?: ColorRepresentation
  shouldApply?: (material: Material) => boolean
}

const hasEmissiveControls = (material: Material): material is EmissiveMaterial => {
  const candidate = material as Partial<EmissiveMaterial>
  return candidate.emissive instanceof Color && typeof candidate.emissiveIntensity === "number"
}

const applyBloomToMaterial = (material: Material, options: BloomMaterialOptions) => {
  if (options.shouldApply && !options.shouldApply(material)) return
  if (!hasEmissiveControls(material)) return

  if (options.emissiveColor) material.emissive.set(options.emissiveColor)
  material.emissiveIntensity = options.emissiveIntensity
  material.needsUpdate = true
}

const cloneOneMaterialWithBloom = (material: Material, options: BloomMaterialOptions): Material => {
  const cloned = material.clone()
  applyBloomToMaterial(cloned, options)
  return cloned
}

export const cloneMaterialWithBloom = <T extends Material | Material[]>(
  material: T,
  options: BloomMaterialOptions,
): T => {
  if (Array.isArray(material)) {
    return material.map((m) => cloneOneMaterialWithBloom(m, options)) as T
  }

  return cloneOneMaterialWithBloom(material, options) as T
}

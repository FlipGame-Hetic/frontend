import type { Material, Object3D } from "three"
import { Mesh } from "three"
import { SPINNING_GLOBE_MATERIAL_EMISSIVE_INTENSITY_BY_NAME } from "./decorationConfig"

interface EmissiveIntensityMaterial extends Material {
  emissiveIntensity: number
}

const hasEmissiveIntensity = (material: Material): material is EmissiveIntensityMaterial => {
  return typeof (material as Partial<EmissiveIntensityMaterial>).emissiveIntensity === "number"
}

const getGlobeEmissiveIntensity = (material: Material): number | undefined => {
  return SPINNING_GLOBE_MATERIAL_EMISSIVE_INTENSITY_BY_NAME[
    material.name as keyof typeof SPINNING_GLOBE_MATERIAL_EMISSIVE_INTENSITY_BY_NAME
  ]
}

const cloneGlobeMaterial = (material: Material): Material => {
  const cloned = material.clone()
  const emissiveIntensity = getGlobeEmissiveIntensity(material)
  if (emissiveIntensity === undefined || !hasEmissiveIntensity(cloned)) return cloned

  cloned.emissiveIntensity = emissiveIntensity
  cloned.needsUpdate = true
  return cloned
}

const isMesh = (node: Object3D): node is Mesh => {
  return node instanceof Mesh
}

export const cloneMaterialWithGlobeBloomConfig = <T extends Material | Material[]>(
  material: T,
): T => {
  if (Array.isArray(material)) {
    return material.map(cloneGlobeMaterial) as T
  }

  return cloneGlobeMaterial(material) as T
}

export const applyGlobeBloomMaterialConfig = (object: Object3D) => {
  object.traverse((node) => {
    if (!isMesh(node)) return
    node.material = cloneMaterialWithGlobeBloomConfig(node.material)
  })
}

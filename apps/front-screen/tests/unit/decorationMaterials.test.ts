import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three"
import { describe, expect, it } from "vitest"
import { SPINNING_GLOBE_MATERIAL_EMISSIVE_INTENSITY_BY_NAME } from "@/components/playfield/decorations/decorationConfig"
import {
  applyGlobeBloomMaterialConfig,
  cloneMaterialWithGlobeBloomConfig,
} from "@/components/playfield/decorations/decorationMaterials"

describe("decorationMaterials", () => {
  it("clones globe materials and applies configured emissive intensities", () => {
    const ocean = new MeshStandardMaterial({ emissive: "#00eaff" })
    ocean.name = "Material.016"
    ocean.emissiveIntensity = 10

    const clone = cloneMaterialWithGlobeBloomConfig(ocean)

    expect(clone).not.toBe(ocean)
    expect(clone.emissiveIntensity).toBe(
      SPINNING_GLOBE_MATERIAL_EMISSIVE_INTENSITY_BY_NAME["Material.016"],
    )
    expect(ocean.emissiveIntensity).toBe(10)
  })

  it("keeps unconfigured cloned materials unchanged", () => {
    const material = new MeshStandardMaterial({ emissive: "#ffffff" })
    material.name = "Material.other"
    material.emissiveIntensity = 3.5

    const clone = cloneMaterialWithGlobeBloomConfig(material)

    expect(clone).not.toBe(material)
    expect(clone.emissiveIntensity).toBe(3.5)
  })

  it("applies the globe config across mesh material arrays", () => {
    const land = new MeshStandardMaterial({ emissive: "#111111" })
    const plain = new MeshBasicMaterial({ color: "#ffffff" })
    land.name = "Material.015"
    plain.name = "Material.018"

    const mesh = new Mesh(undefined, [land, plain])
    const group = new Group()
    group.add(mesh)

    applyGlobeBloomMaterialConfig(group)

    if (!Array.isArray(mesh.material)) throw new Error("expected material array")
    const [landClone, plainClone] = mesh.material
    if (!landClone || !plainClone) throw new Error("expected cloned materials")
    if (!(landClone instanceof MeshStandardMaterial)) {
      throw new Error("expected the configured material to remain standard")
    }

    expect(landClone).not.toBe(land)
    expect(plainClone).not.toBe(plain)
    expect(landClone.emissiveIntensity).toBe(0)
    expect("emissiveIntensity" in plainClone).toBe(false)
  })
})

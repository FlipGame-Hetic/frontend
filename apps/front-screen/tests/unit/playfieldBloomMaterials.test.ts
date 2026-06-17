import { MeshBasicMaterial, MeshStandardMaterial } from "three"
import { describe, expect, it } from "vitest"
import { cloneMaterialWithBloom } from "@/components/playfield/playfieldBloomMaterials"

describe("playfieldBloomMaterials", () => {
  it("clones and boosts emissive materials without mutating the source", () => {
    const source = new MeshStandardMaterial({ emissive: "#111111" })
    source.emissiveIntensity = 0.5

    const clone = cloneMaterialWithBloom(source, {
      emissiveColor: "#00eaff",
      emissiveIntensity: 2.4,
    })

    expect(clone).not.toBe(source)
    expect(clone.emissive.getHexString()).toBe("00eaff")
    expect(clone.emissiveIntensity).toBe(2.4)
    expect(source.emissive.getHexString()).toBe("111111")
    expect(source.emissiveIntensity).toBe(0.5)
  })

  it("supports material arrays and predicates", () => {
    const glow = new MeshStandardMaterial({ emissive: "#ffffff" })
    const skipped = new MeshStandardMaterial({ emissive: "#222222" })
    glow.name = "softbluelight"
    skipped.name = "gunmetal"

    const clones = cloneMaterialWithBloom([glow, skipped], {
      emissiveIntensity: 3.0,
      shouldApply: (material) => material.name === "softbluelight",
    })

    const [glowClone, skippedClone] = clones
    if (!glowClone || !skippedClone) throw new Error("Expected two cloned materials")

    expect(clones).toHaveLength(2)
    expect(glowClone).not.toBe(glow)
    expect(skippedClone).not.toBe(skipped)
    expect(glowClone.emissiveIntensity).toBe(3.0)
    expect(skippedClone.emissiveIntensity).toBe(1.0)
    expect(glow.emissiveIntensity).toBe(1.0)
  })

  it("clones but ignores materials without emissive controls", () => {
    const source = new MeshBasicMaterial({ color: "#00eaff" })

    const clone = cloneMaterialWithBloom(source, {
      emissiveColor: "#ffffff",
      emissiveIntensity: 4.0,
    })

    expect(clone).not.toBe(source)
    expect(clone.color.getHexString()).toBe("00eaff")
    expect("emissiveIntensity" in clone).toBe(false)
  })
})

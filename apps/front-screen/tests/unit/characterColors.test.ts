import { describe, it, expect } from "vitest"
import { getBallColorForCharacter } from "@/config/characterColors"

describe("getBallColorForCharacter", () => {
  it("returns orange for enforcer", () => {
    expect(getBallColorForCharacter("enforcer")).toBe("#FFAA00")
  })

  it("returns green for viper", () => {
    expect(getBallColorForCharacter("viper")).toBe("#7FFF00")
  })

  it("returns pink for ghost", () => {
    expect(getBallColorForCharacter("ghost")).toBe("#FF2D78")
  })

  it("returns silver for oracle", () => {
    expect(getBallColorForCharacter("oracle")).toBe("#C8D8E8")
  })

  it("returns enforcer color when character is undefined", () => {
    expect(getBallColorForCharacter(undefined)).toBe("#FFAA00")
  })
})

import { describe, it, expect } from "vitest"
import { getBallColorForCharacter } from "@/config/characterColors"

describe("getBallColorForCharacter", () => {
  it("returns orange for striker", () => {
    expect(getBallColorForCharacter("striker")).toBe("#FFAA00")
  })

  it("returns blue for defender", () => {
    expect(getBallColorForCharacter("defender")).toBe("#0088FF")
  })

  it("returns teal for trickster", () => {
    expect(getBallColorForCharacter("trickster")).toBe("#00AAAA")
  })

  it("returns grey for heavy", () => {
    expect(getBallColorForCharacter("heavy")).toBe("#556677")
  })

  it("returns striker color when character is undefined", () => {
    expect(getBallColorForCharacter(undefined)).toBe("#FFAA00")
  })
})

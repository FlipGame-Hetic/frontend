import { describe, expect, it } from "vitest"
import { parseComboSequence } from "@/dmd/scenes/comboPayload"

describe("ComboActivated payload", () => {
  it("parses backend combo sequences without multiplier fields", () => {
    expect(parseComboSequence(["L", "R", "L"])).toEqual(["L", "R", "L"])
  })

  it("rejects unknown directions instead of rendering misleading arrows", () => {
    expect(parseComboSequence(["L", "X"])).toBeUndefined()
  })
})

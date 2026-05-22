import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { BALL_SAVER_TARGET_IDS } from "@/components/ballSavers/ballSaverConfig"
import { classifyMesh } from "@/components/playfield/usePlayfieldModel"

describe("usePlayfieldModel — ball saver classification", () => {
  it("classifies only renamed saver meshes as ball savers", () => {
    expect(classifyMesh("l_ball_saver")).toBe("ballSavers")
    expect(classifyMesh("r_ball_saver")).toBe("ballSavers")
    expect(classifyMesh("l_ball_savor")).toBe("cabinet")
  })

  it("uses saver names in the playfield model asset", () => {
    const model = readFileSync(resolve(process.cwd(), "public/models/playfield_x15.glb"))
    const modelText = model.toString("utf8")

    expect(modelText).toContain("l_ball_saver")
    expect(modelText).toContain("r_ball_saver")
    expect(modelText).not.toContain("_ball_savor")
  })

  it("uses every configured ball saver target in the playfield model asset", () => {
    const model = readFileSync(resolve(process.cwd(), "public/models/playfield_x15.glb"))
    const modelText = model.toString("utf8")

    for (const targetId of [...BALL_SAVER_TARGET_IDS.left, ...BALL_SAVER_TARGET_IDS.right]) {
      expect(modelText).toContain(targetId)
    }
  })
})

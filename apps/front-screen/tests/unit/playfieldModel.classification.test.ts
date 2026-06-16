import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three"
import { describe, expect, it } from "vitest"
import { BALL_SAVER_TARGET_IDS } from "@/components/ballSavers/ballSaverConfig"
import { classifyMesh, collectPlayfieldNodes } from "@/components/playfield/usePlayfieldModel"

const PLAYFIELD_MODEL_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/models/playfield.glb",
)

const createNamedMesh = (name: string) => {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
  mesh.name = name
  return mesh
}

const createGateGroup = (name: string, childName: string) => {
  const group = new Group()
  group.name = name
  group.add(createNamedMesh(childName))
  group.add(createNamedMesh(`${childName}_1`))
  return group
}

describe("usePlayfieldModel — ball saver classification", () => {
  it("keeps the central inner bonus mesh in the bonus zone bucket", () => {
    expect(classifyMesh("central_bonus_zone_inter")).toBe("bonusZone")
    expect(classifyMesh("central_bonus_zone")).toBe("playfield")
  })

  it("keeps multiball gate meshes in dedicated buckets", () => {
    expect(classifyMesh("arch")).toBe("multiballGateFrame")
    expect(classifyMesh("door_top")).toBe("multiballGateDoors")
    expect(classifyMesh("door_bottom")).toBe("multiballGateDoors")
  })

  it("uses multiball gate names in the playfield model asset", () => {
    const model = readFileSync(PLAYFIELD_MODEL_PATH)
    const modelText = model.toString("utf8")

    expect(modelText).toContain("arch")
    expect(modelText).toContain("door_top")
    expect(modelText).toContain("door_bottom")
  })

  it("collects multi-primitive multiball gate roots without leaking child meshes into cabinet", () => {
    const scene = new Group()
    const cabinetMesh = createNamedMesh("main_frame")
    const arch = createGateGroup("arch", "Object_1")
    const doorBottom = createGateGroup("door_bottom", "Object_3")
    const doorTop = createGateGroup("door_top", "Object_2")

    scene.add(cabinetMesh, arch, doorBottom, doorTop)

    const nodes = collectPlayfieldNodes(scene)

    expect(nodes.multiballGateFrame).toEqual([arch])
    expect(nodes.multiballGateDoors.map((node) => node.name)).toEqual(["door_bottom", "door_top"])
    expect(nodes.cabinet).toEqual([cabinetMesh])
    expect(nodes.cabinet.map((node) => node.name)).not.toContain("Object_1")
    expect(nodes.cabinet.map((node) => node.name)).not.toContain("Object_2")
    expect(nodes.cabinet.map((node) => node.name)).not.toContain("Object_3")

    for (const gateRoot of [arch, doorBottom, doorTop]) {
      gateRoot.traverse((node) => {
        if (!(node instanceof Mesh)) return
        expect(node.castShadow).toBe(true)
        expect(node.receiveShadow).toBe(true)
      })
    }
  })

  it("classifies only renamed saver meshes as ball savers", () => {
    expect(classifyMesh("l_ball_saver")).toBe("ballSavers")
    expect(classifyMesh("r_ball_saver")).toBe("ballSavers")
    expect(classifyMesh("l_ball_savor")).toBe("cabinet")
  })

  it("uses the inner bonus mesh in the playfield model asset", () => {
    const model = readFileSync(PLAYFIELD_MODEL_PATH)
    const modelText = model.toString("utf8")

    expect(modelText).toContain("central_bonus_zone_inter")
  })

  it("uses saver names in the playfield model asset", () => {
    const model = readFileSync(PLAYFIELD_MODEL_PATH)
    const modelText = model.toString("utf8")

    expect(modelText).toContain("l_ball_saver")
    expect(modelText).toContain("r_ball_saver")
    expect(modelText).not.toContain("_ball_savor")
  })

  it("uses every configured ball saver target in the playfield model asset", () => {
    const model = readFileSync(PLAYFIELD_MODEL_PATH)
    const modelText = model.toString("utf8")

    for (const targetId of [...BALL_SAVER_TARGET_IDS.left, ...BALL_SAVER_TARGET_IDS.right]) {
      expect(modelText).toContain(targetId)
    }
  })
})

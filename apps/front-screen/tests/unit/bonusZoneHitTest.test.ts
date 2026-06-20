import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { BoxGeometry, Mesh, MeshBasicMaterial, PlaneGeometry } from "three"
import { describe, expect, it } from "vitest"
import { createBonusZoneHitTester } from "@/components/playfield/bonusZoneHitTest"
import { cloneAtWorldTransform } from "@/components/playfield/usePlayfieldModel"

const PLAYFIELD_MODEL_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/models/playfield/playfield.glb",
)

type Vec3Tuple = [number, number, number]
type QuaternionTuple = [number, number, number, number]

interface GlbJson {
  accessors: {
    max?: Vec3Tuple
    min?: Vec3Tuple
  }[]
  meshes: { primitives: { attributes: { POSITION: number }; mode?: number }[] }[]
  nodes: {
    mesh?: number
    name?: string
    rotation?: QuaternionTuple
    scale?: Vec3Tuple
    translation?: Vec3Tuple
  }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseGlbJson(source: string): GlbJson {
  const parsed: unknown = JSON.parse(source)

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.accessors) ||
    !Array.isArray(parsed.meshes) ||
    !Array.isArray(parsed.nodes)
  ) {
    throw new Error("Invalid JSON chunk in playfield.glb")
  }

  return parsed as unknown as GlbJson
}

function readPlayfieldModelJson(): GlbJson {
  const model = readFileSync(PLAYFIELD_MODEL_PATH)
  let offset = 12
  let json: GlbJson | undefined

  while (offset < model.length) {
    const chunkLength = model.readUInt32LE(offset)
    const chunkType = model.toString("utf8", offset + 4, offset + 8)
    const chunkStart = offset + 8

    if (chunkType === "JSON") {
      json = parseGlbJson(model.toString("utf8", chunkStart, chunkStart + chunkLength))
    }

    offset = chunkStart + chunkLength
  }

  if (!json) throw new Error("Missing JSON chunk in playfield.glb")

  return json
}

function loadPlayfieldMesh(name: string): Mesh {
  const json = readPlayfieldModelJson()
  const node = json.nodes.find((candidate) => candidate.name === name)
  if (node?.mesh === undefined) throw new Error(`Missing playfield mesh node: ${name}`)

  const glbMesh = json.meshes[node.mesh]
  const primitive = glbMesh?.primitives[0]
  if (!primitive) throw new Error(`Missing mesh primitive for ${name}`)

  if (primitive.mode !== undefined && primitive.mode !== 4) {
    throw new Error(`Unsupported primitive mode for ${name}: ${String(primitive.mode)}`)
  }

  const positions = json.accessors[primitive.attributes.POSITION]
  if (!positions?.min || !positions.max) throw new Error(`Missing position bounds for ${name}`)

  const [minX, minY, minZ] = positions.min
  const [maxX, maxY, maxZ] = positions.max
  const geometry = new BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ)
  geometry.translate((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)

  const mesh = new Mesh(geometry, new MeshBasicMaterial())
  mesh.name = name
  mesh.position.fromArray(node.translation ?? [0, 0, 0])
  mesh.quaternion.fromArray(node.rotation ?? [0, 0, 0, 1])
  mesh.scale.fromArray(node.scale ?? [1, 1, 1])
  mesh.updateWorldMatrix(true, false)

  return cloneAtWorldTransform(mesh)
}

function makeZoneWall(x: number): Mesh {
  const wall = new Mesh(new PlaneGeometry(2, 2))
  wall.position.x = x
  wall.rotation.y = Math.PI / 2
  wall.updateWorldMatrix(true, false)
  return wall
}

describe("bonusZoneHitTest", () => {
  it("keeps hits from the inside and rejects hits from the outside of the inner mesh", () => {
    const tester = createBonusZoneHitTester([makeZoneWall(-1), makeZoneWall(1)])

    expect(tester.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true)
    expect(tester.containsPoint({ x: -1.2, y: 0, z: 0 })).toBe(false)
    expect(tester.containsPoint({ x: 1.2, y: 0, z: 0 })).toBe(false)
    expect(tester.containsPoint({ x: 0, y: 0, z: 1.2 })).toBe(false)
  })

  it("uses the actual GLB inner bonus mesh as the playable bonus footprint", () => {
    const mesh = loadPlayfieldMesh("central_bonus_zone_inter")
    const tester = createBonusZoneHitTester([mesh])

    expect(tester.containsPoint({ x: -0.35, y: 1.6, z: -4 })).toBe(true)
    expect(tester.containsPoint({ x: -1.3, y: 1.6, z: -4 })).toBe(false)
    expect(tester.containsPoint({ x: 0.6, y: 1.6, z: -4 })).toBe(false)
    expect(tester.containsPoint({ x: -0.35, y: 1.6, z: -3 })).toBe(false)
  })
})

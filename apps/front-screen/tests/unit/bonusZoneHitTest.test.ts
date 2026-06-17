import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, PlaneGeometry } from "three"
import { describe, expect, it } from "vitest"
import { createBonusZoneHitTester } from "@/components/playfield/bonusZoneHitTest"
import { cloneAtWorldTransform } from "@/components/playfield/usePlayfieldModel"

const PLAYFIELD_MODEL_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/models/playfield.glb",
)

interface GlbJson {
  accessors: {
    bufferView: number
    byteOffset?: number
    componentType: number
    count: number
    type: "SCALAR" | "VEC2" | "VEC3" | "VEC4"
  }[]
  bufferViews: { byteLength: number; byteOffset?: number; byteStride?: number }[]
  meshes: { primitives: { attributes: { POSITION: number }; indices?: number; mode?: number }[] }[]
  nodes: {
    mesh?: number
    name?: string
    rotation?: number[]
    scale?: number[]
    translation?: number[]
  }[]
}

type AccessorArray = Float32Array | Uint8Array | Uint16Array | Uint32Array
type AccessorArrayConstructor =
  | Float32ArrayConstructor
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor

const ACCESSOR_ITEM_SIZES: Record<GlbJson["accessors"][number]["type"], number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
}

const ACCESSOR_ARRAYS: Partial<Record<number, AccessorArrayConstructor>> = {
  5121: Uint8Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseGlbJson(source: string): GlbJson {
  const parsed: unknown = JSON.parse(source)

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.accessors) ||
    !Array.isArray(parsed.bufferViews) ||
    !Array.isArray(parsed.meshes) ||
    !Array.isArray(parsed.nodes)
  ) {
    throw new Error("Invalid JSON chunk in playfield.glb")
  }

  return parsed as unknown as GlbJson
}

function readPlayfieldModelChunks(): { json: GlbJson; bin: Buffer } {
  const model = readFileSync(PLAYFIELD_MODEL_PATH)
  let offset = 12
  let json: GlbJson | undefined
  let bin: Buffer | undefined

  while (offset < model.length) {
    const chunkLength = model.readUInt32LE(offset)
    const chunkType = model.toString("utf8", offset + 4, offset + 8)
    const chunkStart = offset + 8

    if (chunkType === "JSON") {
      json = parseGlbJson(model.toString("utf8", chunkStart, chunkStart + chunkLength))
    }

    if (chunkType === "BIN\0") {
      bin = model.subarray(chunkStart, chunkStart + chunkLength)
    }

    offset = chunkStart + chunkLength
  }

  if (!json || !bin) throw new Error("Missing GLB chunks in playfield.glb")

  return { json, bin }
}

function readAccessor(json: GlbJson, bin: Buffer, accessorIndex: number): AccessorArray {
  const accessor = json.accessors[accessorIndex]
  if (!accessor) throw new Error(`Missing accessor: ${String(accessorIndex)}`)

  const bufferView = json.bufferViews[accessor.bufferView]
  if (!bufferView) throw new Error(`Missing buffer view: ${String(accessor.bufferView)}`)

  const ArrayType = ACCESSOR_ARRAYS[accessor.componentType]
  if (!ArrayType) {
    throw new Error(`Unsupported accessor component type: ${String(accessor.componentType)}`)
  }

  const itemSize = ACCESSOR_ITEM_SIZES[accessor.type]
  const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const expectedStride = itemSize * ArrayType.BYTES_PER_ELEMENT
  if (bufferView.byteStride && bufferView.byteStride !== expectedStride) {
    throw new Error("Strided GLB accessors are not supported by this test helper")
  }

  if (!(bin.buffer instanceof ArrayBuffer)) throw new Error("Unsupported shared GLB buffer")

  return new ArrayType(bin.buffer, bin.byteOffset + byteOffset, accessor.count * itemSize)
}

function loadPlayfieldMesh(name: string): Mesh {
  const { json, bin } = readPlayfieldModelChunks()
  const node = json.nodes.find((candidate) => candidate.name === name)
  if (node?.mesh === undefined) throw new Error(`Missing playfield mesh node: ${name}`)

  const glbMesh = json.meshes[node.mesh]
  const primitive = glbMesh?.primitives[0]
  if (!primitive) throw new Error(`Missing mesh primitive for ${name}`)

  if (primitive.mode !== undefined && primitive.mode !== 4) {
    throw new Error(`Unsupported primitive mode for ${name}: ${String(primitive.mode)}`)
  }

  const geometry = new BufferGeometry()
  const positions = readAccessor(json, bin, primitive.attributes.POSITION)
  if (!(positions instanceof Float32Array))
    throw new Error(`Unsupported position accessor: ${name}`)

  geometry.setAttribute("position", new BufferAttribute(positions, 3))
  if (primitive.indices !== undefined) {
    geometry.setIndex(new BufferAttribute(readAccessor(json, bin, primitive.indices), 1))
  }

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

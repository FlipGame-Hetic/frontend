import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Mesh, PlaneGeometry } from "three"
import type { Object3D } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { describe, expect, it } from "vitest"
import { createBonusZoneHitTester } from "@/components/playfield/bonusZoneHitTest"
import { cloneAtWorldTransform } from "@/components/playfield/usePlayfieldModel"

const PLAYFIELD_MODEL_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/models/playfield.glb",
)

function isMesh(node: Object3D): node is Mesh {
  return (node as Mesh).isMesh
}

async function loadPlayfieldMesh(name: string): Promise<Mesh> {
  const model = readFileSync(PLAYFIELD_MODEL_PATH)
  const arrayBuffer = model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength)
  const gltf = await new Promise<{ scene: Object3D }>((resolve, reject) => {
    new GLTFLoader().parse(arrayBuffer, "", resolve, reject)
  })

  const meshes: Mesh[] = []
  gltf.scene.traverse((node) => {
    if (isMesh(node)) meshes.push(node)
  })

  const mesh = meshes.find((candidate) => candidate.name === name)
  if (mesh === undefined) throw new Error(`Missing playfield mesh: ${name}`)

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

  it("uses the actual GLB inner bonus mesh as the playable bonus footprint", async () => {
    const mesh = await loadPlayfieldMesh("central_bonus_zone_inter")
    const tester = createBonusZoneHitTester([mesh])

    expect(tester.containsPoint({ x: -0.35, y: 1.6, z: -4 })).toBe(true)
    expect(tester.containsPoint({ x: -1.3, y: 1.6, z: -4 })).toBe(false)
    expect(tester.containsPoint({ x: 0.6, y: 1.6, z: -4 })).toBe(false)
    expect(tester.containsPoint({ x: -0.35, y: 1.6, z: -3 })).toBe(false)
  })
})

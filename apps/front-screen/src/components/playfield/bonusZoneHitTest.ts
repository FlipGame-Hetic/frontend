import type { Mesh } from "three"
import { Ray, Vector3 } from "three"

interface Point3 {
  x: number
  y: number
  z: number
}

interface Triangle {
  a: Vector3
  b: Vector3
  c: Vector3
}

const RAY_DIRECTION = new Vector3(1, 0, 0)
const HIT_DEDUP_EPSILON = 1e-4

const getWorldVertex = (mesh: Mesh, vertexIndex: number): Vector3 => {
  const position = mesh.geometry.getAttribute("position")
  return new Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.matrixWorld)
}

const collectWorldTriangles = (mesh: Mesh): Triangle[] => {
  mesh.updateWorldMatrix(true, false)

  const triangles: Triangle[] = []
  const position = mesh.geometry.getAttribute("position")
  const index = mesh.geometry.getIndex()

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      triangles.push({
        a: getWorldVertex(mesh, index.getX(i)),
        b: getWorldVertex(mesh, index.getX(i + 1)),
        c: getWorldVertex(mesh, index.getX(i + 2)),
      })
    }
    return triangles
  }

  for (let i = 0; i < position.count; i += 3) {
    triangles.push({
      a: getWorldVertex(mesh, i),
      b: getWorldVertex(mesh, i + 1),
      c: getWorldVertex(mesh, i + 2),
    })
  }

  return triangles
}

const hasSimilarDistance = (distances: number[], distance: number): boolean => {
  return distances.some((existing) => Math.abs(existing - distance) < HIT_DEDUP_EPSILON)
}

export const createBonusZoneHitTester = (meshes: Mesh[]) => {
  const triangles = meshes.flatMap(collectWorldTriangles)
  const ray = new Ray()
  const origin = new Vector3()
  const hit = new Vector3()

  return {
    containsPoint(point: Point3): boolean {
      if (triangles.length === 0) return false

      origin.set(point.x, point.y, point.z)
      ray.set(origin, RAY_DIRECTION)

      const distances: number[] = []
      for (const triangle of triangles) {
        const intersection = ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, hit)
        if (!intersection) continue

        const distance = intersection.distanceTo(origin)
        if (distance < HIT_DEDUP_EPSILON) continue
        if (hasSimilarDistance(distances, distance)) continue

        distances.push(distance)
      }

      return distances.length % 2 === 1
    },
  }
}

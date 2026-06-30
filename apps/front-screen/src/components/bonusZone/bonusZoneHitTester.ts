import type { Position3Type } from "@/types/worldTypes"
import type { Mesh } from "three"
import { Ray, Vector3 } from "three"

interface Triangle {
  a: Vector3
  b: Vector3
  c: Vector3
}

// We shoot the test ray straight along +x, so that any fixed direction gives the right result
const RAY_DIRECTION = new Vector3(1, 0, 0)
// Two hits closer than this are treated as the same hit, to drop duplicates events
const HIT_DEDUP_EPSILON = 1e-4

// Reads one vertex of the mesh and moves it into world space with the mesh transform
const getWorldVertex = (mesh: Mesh, vertexIndex: number): Vector3 => {
  const position = mesh.geometry.getAttribute("position")
  return new Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.matrixWorld)
}

// Turns a mesh into a flat list of world-space triangles we can ray-test against
const collectWorldTriangles = (mesh: Mesh): Triangle[] => {
  mesh.updateWorldMatrix(true, false)

  const triangles: Triangle[] = []
  const position = mesh.geometry.getAttribute("position")
  const index = mesh.geometry.getIndex()

  // Indexed geometry reuses vertices, so each triangle is three entries of the index buffer
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

  // Without an index buffer the vertices are already laid out three at a time, one per triangle
  for (let i = 0; i < position.count; i += 3) {
    triangles.push({
      a: getWorldVertex(mesh, i),
      b: getWorldVertex(mesh, i + 1),
      c: getWorldVertex(mesh, i + 2),
    })
  }

  return triangles
}

// True if we already recorded a hit at approx. the same distance, used to skip duplicate hits
const hasSimilarDistance = (distances: number[], distance: number): boolean => {
  return distances.some((existing) => Math.abs(existing - distance) < HIT_DEDUP_EPSILON)
}

// Builds a tester that tells whether a point sits inside the closed mesh of the bonus zone
export const createBonusZoneHitTester = (meshes: Mesh[]) => {
  const triangles = meshes.flatMap(collectWorldTriangles)
  const ray = new Ray()
  const origin = new Vector3()
  const hit = new Vector3()

  return {
    // Shoots a ray from the point and counts how many times it crosses the mesh
    containsPoint(point: Position3Type): boolean {
      if (triangles.length === 0) return false

      origin.set(point.x, point.y, point.z)
      ray.set(origin, RAY_DIRECTION)

      const distances: number[] = []
      for (const triangle of triangles) {
        const intersection = ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, hit)
        if (!intersection) continue

        const distance = intersection.distanceTo(origin)
        // Drop a hit sitting right on the origin, the point is on the surface and would skew the count
        if (distance < HIT_DEDUP_EPSILON) continue
        if (hasSimilarDistance(distances, distance)) continue

        distances.push(distance)
      }

      // An odd number of crossings means the point is enclosed by the mesh (the ball is either at the left of the bonusZone, the ray is stopped by the ball before it crosses any bonusZone wall, or at the right of the bonusZone and the ray will cross the 2 walls), whereas an even number means it is inside (the ray crosses one wall)
      return distances.length % 2 === 1
    },
  }
}

import { render } from "@testing-library/react"
import { BoxGeometry, Mesh, MeshBasicMaterial } from "three"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PlayfieldNodes } from "@/components/playfield/usePlayfieldModel"

const { bumperProps } = vi.hoisted(() => ({
  bumperProps: [] as Record<string, unknown>[],
}))

vi.mock("@/components/bumpers/Bumper", () => ({
  default: (props: Record<string, unknown>) => {
    bumperProps.push(props)
    return null
  },
}))

import BumpersManager from "@/components/bumpers/BumpersManager"

const createMesh = (name: string, x = 0): Mesh => {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
  mesh.name = name
  mesh.position.set(x, 0, 0)
  mesh.updateWorldMatrix(true, false)
  return mesh
}

const createNodes = (): PlayfieldNodes => ({
  cabinet: [],
  playfield: [],
  bonusZone: [],
  flippers: [],
  bumpers: [createMesh("c_bumper_base"), createMesh("r_bumper_big_base", 2)],
  bumperRubbers: [createMesh("c_bumper_rubber"), createMesh("r_bumper_big_rubber", 2)],
  slimBumpers: [],
  slingshots: [],
  slingshotRubbers: [],
  targets: [],
  ballSavers: [],
  plunger: [],
  overhead: [],
  tunnels: [],
  lockedBall: [],
  spinner: [],
  rails: [],
  multiballGateFrame: [],
  multiballGateDoors: [],
  animatedGroups: [],
})

describe("BumpersManager", () => {
  beforeEach(() => {
    bumperProps.length = 0
  })

  it("marks the central multiball bumper as no-score and no-bonus", () => {
    render(<BumpersManager nodes={createNodes()} />)

    const centerBumper = bumperProps.find((props) => {
      const mesh = props.meshOverride as Mesh | undefined
      return mesh?.name === "c_bumper_base"
    })
    const regularBumper = bumperProps.find((props) => {
      const mesh = props.meshOverride as Mesh | undefined
      return mesh?.name === "r_bumper_big_base"
    })

    expect(centerBumper).toMatchObject({ awardScore: false })
    expect(centerBumper).not.toHaveProperty("onBonusHit")
    expect(regularBumper).toMatchObject({ awardScore: true })
  })
})

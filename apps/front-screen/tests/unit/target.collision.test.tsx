import { render, act } from "@testing-library/react"
import { BoxGeometry, Mesh } from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { handlers, mockBody, mockSetEnabled } = vi.hoisted(() => {
  const mockSetEnabled = vi.fn()
  const mockCollider = { setEnabled: mockSetEnabled }
  const mockBody = {
    numColliders: vi.fn(() => 1),
    collider: vi.fn(() => mockCollider),
    setNextKinematicTranslation: vi.fn(),
    setNextKinematicRotation: vi.fn(),
  }

  return {
    handlers: {
      frame: null as (() => void) | null,
      onCollisionEnter: null as ((payload: unknown) => void) | null,
      rigidBodyProps: null as Record<string, unknown> | null,
    },
    mockBody,
    mockSetEnabled,
  }
})

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn((callback: () => void) => {
    handlers.frame = callback
  }),
}))

vi.mock("@react-three/rapier", () => {
  interface RigidBodyMockProps {
    onCollisionEnter?: (p: unknown) => void
    ref?: { current: unknown } | null
    [key: string]: unknown
  }

  return {
    RigidBody: function rigidBodyMock(props: RigidBodyMockProps) {
      handlers.onCollisionEnter = props.onCollisionEnter ?? null
      handlers.rigidBodyProps = props
      if (props.ref && "current" in props.ref) {
        props.ref.current = mockBody
      }
      return null
    },
  }
})

import Target, { DROP_TARGET_RETURN_DURATION } from "@/components/targets/Target"
import useTargetStore from "@/stores/useTargetStore"

let currentTime = 1000
let nowSpy: { mockRestore: () => void } | null = null

function makeTargetMesh(name = "l_target_02") {
  const mesh = new Mesh(new BoxGeometry(0.12, 0.36, 0.24))
  mesh.name = name
  return mesh
}

function renderTarget(name = "l_target_02") {
  return render(<Target mesh={makeTargetMesh(name)} worldPosition={[0, 0, 0]} />)
}

function makeBallPayload(name = "ball") {
  return {
    other: {
      rigidBodyObject: { name },
    },
  }
}

function callCollision(payload = makeBallPayload()) {
  if (handlers.onCollisionEnter === null) {
    throw new Error("onCollisionEnter was not captured — did you render <Target>?")
  }
  act(() => {
    handlers.onCollisionEnter?.(payload)
  })
}

function runFrame() {
  if (handlers.frame === null) {
    throw new Error("useFrame callback was not captured — did you render <Target>?")
  }
  act(() => {
    handlers.frame?.()
  })
}

describe("Target — drop target collisions", () => {
  beforeEach(() => {
    nowSpy?.mockRestore()
    currentTime = 1000
    nowSpy = vi.spyOn(performance, "now").mockImplementation(() => currentTime)

    mockSetEnabled.mockReset()
    mockBody.numColliders.mockClear()
    mockBody.collider.mockClear()
    mockBody.setNextKinematicTranslation.mockClear()
    mockBody.setNextKinematicRotation.mockClear()
    handlers.frame = null
    handlers.onCollisionEnter = null
    handlers.rigidBodyProps = null
    useTargetStore.setState({ activatedTargetIds: [], targetHits: [] })
  })

  afterEach(() => {
    nowSpy?.mockRestore()
    nowSpy = null
  })

  it("uses a hull collider for more reliable ball contact", () => {
    renderTarget()

    expect(handlers.rigidBodyProps?.colliders).toBe("hull")
  })

  it("activates the target and keeps collider enabled immediately after hit", () => {
    renderTarget()
    mockSetEnabled.mockClear()

    callCollision()

    expect(useTargetStore.getState().activatedTargetIds).toContain("l_target_02")
    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)
  })

  it("does not re-record a hit while the drop target is already activated", () => {
    renderTarget()

    callCollision()
    callCollision()

    expect(useTargetStore.getState().targetHits).toHaveLength(1)
  })

  it("disables the collider only after the drop animation completes", () => {
    renderTarget()
    mockSetEnabled.mockClear()

    callCollision()
    currentTime = 1139
    runFrame()

    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)

    currentTime = 1140
    runFrame()

    expect(mockSetEnabled).toHaveBeenCalledWith(false)
  })

  it("reenables the collider only after the target reset animation completes", () => {
    renderTarget()
    mockSetEnabled.mockClear()

    callCollision()
    currentTime = 1140
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledWith(false)

    mockSetEnabled.mockClear()
    act(() => {
      useTargetStore.getState().resetTarget("l_target_02")
    })

    expect(mockSetEnabled).not.toHaveBeenCalledWith(true)

    currentTime = 1140 + DROP_TARGET_RETURN_DURATION - 1
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(true)

    currentTime = 1140 + DROP_TARGET_RETURN_DURATION
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledWith(true)
  })
})

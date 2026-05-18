import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

const { mockBroadcastEvent, handlers, mockApplyImpulse, mockBody } = vi.hoisted(() => {
  const mockApplyImpulse = vi.fn()
  const mockBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: mockApplyImpulse,
    linvel: () => ({ x: 5, y: 0, z: 5 }),
  }

  return {
    mockBroadcastEvent: vi.fn(),
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
    mockApplyImpulse,
    mockBody,
  }
})

vi.mock("@frontend/ws", () => ({
  broadcastEvent: mockBroadcastEvent,
  registerScreenSender: vi.fn(),
}))

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}))

vi.mock("@/debug/physicsDebugContext", () => ({
  usePhysicsDebugControls: () => ({
    ball: {
      maxTangentSpeed: 5,
      laneMaxTangentSpeed: 100,
      minNormalSpeed: -4,
      maxNormalSpeed: 0,
    },
    bumpers: {
      restitution: 0.3,
      impulseStrength: 15,
      stuckFrames: 30,
      stuckVelocity: 0.5,
      unstickImpulse: 5,
    },
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
      if (props.ref && "current" in props.ref) {
        props.ref.current = mockBody
      }
      return null
    },
  }
})

import Bumper from "@/components/bumbers/Bumper"

function callHandler(payload: unknown): void {
  if (handlers.onCollisionEnter === null) {
    throw new Error("onCollisionEnter was not captured — did you render <Bumper>?")
  }
  handlers.onCollisionEnter(payload)
}

function makeBallPayload(overrides?: {
  name?: string
  rigidBody?: unknown
  rigidBodyObject?: unknown
}) {
  return {
    other: {
      rigidBody:
        overrides?.rigidBody !== undefined
          ? overrides.rigidBody
          : {
              translation: () => ({ x: 1, y: 0, z: 1 }),
              mass: () => 1,
              applyImpulse: vi.fn(),
              linvel: () => ({ x: 5, y: 2, z: 5 }),
              setLinvel: vi.fn(),
            },
      rigidBodyObject:
        overrides?.rigidBodyObject !== undefined
          ? overrides.rigidBodyObject
          : { name: overrides?.name ?? "ball" },
    },
  }
}

describe("Bumper — handleCollision", () => {
  beforeEach(() => {
    mockBroadcastEvent.mockReset()
    mockApplyImpulse.mockReset()
    handlers.onCollisionEnter = null
  })

  describe("success — ball collision", () => {
    it("calls broadcastEvent exactly once when the ball hits the bumper", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={3} />)
      callHandler(makeBallPayload())
      expect(mockBroadcastEvent).toHaveBeenCalledOnce()
    })

    it("broadcasts bumper_hit with the correct bumperId", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={3} />)
      callHandler(makeBallPayload())
      expect(mockBroadcastEvent).toHaveBeenCalledWith({
        event_type: "bumper_hit",
        payload: { bumper_id: 3 },
      })
    })

    it("passes each bumper's index as its bumper_id", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)
      callHandler(makeBallPayload())
      expect(mockBroadcastEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { bumper_id: 0 } }),
      )

      mockBroadcastEvent.mockReset()

      render(<Bumper position={[0, 0, 0]} bumperId={8} />)
      callHandler(makeBallPayload())
      expect(mockBroadcastEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { bumper_id: 8 } }),
      )
    })
  })

  describe("error — non-ball collision", () => {
    it("does not broadcast when the collider is a wall", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)
      callHandler(makeBallPayload({ name: "wall" }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })

    it("does not broadcast when the collider is a gutter", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)
      callHandler(makeBallPayload({ name: "gutter" }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })

    it("does not broadcast when rigidBodyObject is null (sensor collider)", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)
      callHandler(makeBallPayload({ rigidBodyObject: null }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })
  })

  describe("edge — missing rigidBody on other object", () => {
    it("returns early and does not broadcast when other.rigidBody is null", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={2} />)
      callHandler(makeBallPayload({ rigidBody: null }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import type { ScreenEvent } from "@frontend/types"

const { mockBroadcastEvent, handlers, mockApplyImpulse, mockBody } = vi.hoisted(() => {
  const mockApplyImpulse = vi.fn()
  const mockBroadcastEvent = vi.fn<(event: ScreenEvent) => void>()
  const mockBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: mockApplyImpulse,
    linvel: () => ({ x: 5, y: 0, z: 5 }),
  }

  return {
    mockBroadcastEvent,
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

import { applyBumperImpulse } from "@/components/bumpers/bumperCollision"
import { BUMPER_MAX_EXIT_TANGENT_SPEED } from "@/components/bumpers/bumperConfig"
import { clampBallVelocityToPlayfield } from "@/components/playfield/playfieldConfig"
import Bumper from "@/components/bumpers/Bumper"

function callHandler(payload: unknown): void {
  if (handlers.onCollisionEnter === null) {
    throw new Error("onCollisionEnter was not captured — did you render <Bumper>?")
  }
  handlers.onCollisionEnter(payload)
}

function makeBallPayload(overrides?: {
  ballId?: string
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
          : {
              name: overrides?.name ?? "ball",
              userData: { ballId: overrides?.ballId ?? "ball-1" },
            },
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
    it("broadcasts a haptic pulse and the score event when the ball hits the bumper", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload())
      expect(mockBroadcastEvent).toHaveBeenCalledTimes(2)
      const hapticEvent = mockBroadcastEvent.mock.calls[0]?.[0]
      expect(hapticEvent).toMatchObject({
        event_type: "BallHit",
        payload: {
          hits: [
            {
              id: "bumper",
              type: "bumper",
              position: { x: 0, z: 0 },
            },
          ],
        },
      })
      expect(mockBroadcastEvent).toHaveBeenNthCalledWith(2, {
        event_type: "Bumper",
        payload: { ball_id: "ball-1" },
      })

      if (hapticEvent?.event_type !== "BallHit") {
        throw new Error("Expected first broadcast to be a BallHit event")
      }
      const hit = hapticEvent.payload.hits[0]
      expect(hit).toBeDefined()
      if (!hit) {
        throw new Error("Expected BallHit event to contain one hit")
      }
      expect(hit.force).toBeGreaterThan(0)
      expect(hit.force).toBeLessThanOrEqual(1)
    })

    it("broadcasts the back-screen bumper event with the ball id", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ ballId: "ball-7" }))
      expect(mockBroadcastEvent).toHaveBeenCalledWith({
        event_type: "Bumper",
        payload: { ball_id: "ball-7" },
      })
    })

    it("keeps haptics but does not broadcast score events when scoring is disabled", () => {
      const ballBody = {
        translation: () => ({ x: 1, y: 0, z: 1 }),
        mass: () => 1,
        applyImpulse: vi.fn(),
        linvel: () => ({ x: 5, y: 2, z: 5 }),
        setLinvel: vi.fn(),
      }

      render(<Bumper position={[0, 0, 0]} awardScore={false} />)
      callHandler(makeBallPayload({ rigidBody: ballBody }))

      expect(mockBroadcastEvent).toHaveBeenCalledOnce()
      expect(mockBroadcastEvent.mock.calls[0]?.[0]).toMatchObject({
        event_type: "BallHit",
        payload: { hits: [{ id: "bumper", type: "bumper", position: { x: 0, z: 0 } }] },
      })
      expect(mockBroadcastEvent.mock.calls.some(([event]) => event.event_type === "Bumper")).toBe(
        false,
      )
      expect(ballBody.applyImpulse).toHaveBeenCalledOnce()
    })

    it("includes only the ball id in payload", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ ballId: "ball-left" }))
      expect(mockBroadcastEvent).toHaveBeenLastCalledWith({
        event_type: "Bumper",
        payload: { ball_id: "ball-left" },
      })
    })

    it("clamps the ball velocity immediately after applying the bumper impulse", () => {
      const ballBody = {
        translation: () => ({ x: 1, y: 0, z: 1 }),
        mass: () => 1,
        applyImpulse: vi.fn(),
        linvel: () => ({ x: 30, y: 3, z: 40 }),
        setLinvel: vi.fn(),
      }

      const dir = { x: 0.707, y: 0, z: 0.707 }
      applyBumperImpulse(ballBody as never, dir, 15, -4, 0)

      const expectedExit = clampBallVelocityToPlayfield(
        { x: 30, y: 3, z: 40 },
        BUMPER_MAX_EXIT_TANGENT_SPEED,
        -4,
        0,
      )

      expect(ballBody.setLinvel).toHaveBeenCalledWith(expectedExit, true)
      expect(ballBody.applyImpulse).toHaveBeenCalledOnce()
      expect(ballBody.setLinvel).toHaveBeenLastCalledWith(expectedExit, true)
    })
  })

  describe("error — non-ball collision", () => {
    it("does not broadcast when the collider is a wall", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ name: "wall" }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })

    it("does not broadcast when the collider is a gutter", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ name: "gutter" }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })

    it("does not broadcast when rigidBodyObject is null (sensor collider)", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ rigidBodyObject: null }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })
  })

  describe("edge — missing rigidBody on other object", () => {
    it("returns early and does not broadcast when other.rigidBody is null", () => {
      render(<Bumper position={[0, 0, 0]} />)
      callHandler(makeBallPayload({ rigidBody: null }))
      expect(mockBroadcastEvent).not.toHaveBeenCalled()
    })
  })
})

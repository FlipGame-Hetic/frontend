import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEvent } from "@frontend/types"

const { handlers, mockBallBody, mockBroadcastEvent, mockSourceBody } = vi.hoisted(() => {
  const mockBroadcastEvent = vi.fn<(event: ScreenEvent) => void>()
  const mockBallBody = {
    translation: () => ({ x: 1, y: 0, z: 0 }),
    linvel: () => ({ x: 7, y: 0, z: 0 }),
    mass: () => 2,
    applyImpulse: vi.fn(),
  }
  const mockSourceBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
  }

  return {
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
    mockBallBody,
    mockBroadcastEvent,
    mockSourceBody,
  }
})

vi.mock("@frontend/ws", () => ({
  broadcastEvent: mockBroadcastEvent,
  registerScreenSender: vi.fn(),
}))

vi.mock("@/audio/soundEngine", () => ({
  playRandomSfx: vi.fn(),
}))

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}))

vi.mock("@react-three/rapier", () => {
  interface RigidBodyMockProps {
    children?: unknown
    ref?: { current: unknown } | null
  }

  interface ColliderMockProps {
    onCollisionEnter?: (payload: unknown) => void
  }

  return {
    RigidBody: function rigidBodyMock(props: RigidBodyMockProps) {
      if (props.ref && "current" in props.ref) {
        props.ref.current = mockSourceBody
      }
      return props.children ?? null
    },
    MeshCollider: function meshColliderMock() {
      return null
    },
    CuboidCollider: function cuboidColliderMock(props: ColliderMockProps) {
      handlers.onCollisionEnter = props.onCollisionEnter ?? null
      return null
    },
  }
})

import Slingshot from "@/components/slingshots/Slingshot"

const callCollision = () => {
  if (!handlers.onCollisionEnter) throw new Error("Expected Slingshot collision handler")

  handlers.onCollisionEnter({
    other: {
      rigidBody: mockBallBody,
      rigidBodyObject: { name: "ball", userData: { ballId: "ball-s" } },
    },
  })
}

describe("Slingshot — handleCollision", () => {
  beforeEach(() => {
    handlers.onCollisionEnter = null
    mockBallBody.applyImpulse.mockReset()
    mockBroadcastEvent.mockReset()
  })

  it("broadcasts the triangle event and applies a mass-scaled impulse", () => {
    render(<Slingshot position={[0, 0, 0]} side="left" moduleMesh={{} as never} />)

    callCollision()

    const hapticEvent = mockBroadcastEvent.mock.calls[0]?.[0]
    expect(hapticEvent).toMatchObject({
      event_type: "BallHit",
      payload: {
        hits: [
          {
            id: "left_slingshot",
            type: "slingshot",
            position: { x: 0, z: 0 },
          },
        ],
      },
    })
    if (hapticEvent?.event_type !== "BallHit") {
      throw new Error("Expected first broadcast to be a BallHit event")
    }
    expect(typeof hapticEvent.payload.hits[0]?.force).toBe("number")

    expect(mockBroadcastEvent).toHaveBeenCalledWith({
      event_type: "BumperTriangle",
      payload: { ball_id: "ball-s" },
    })
    expect(mockBallBody.applyImpulse).toHaveBeenCalledWith({ x: 4, y: 0, z: 0 }, true)
  })
})

import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { handlers, mockBallBody, mockBroadcastEvent, mockSourceBody } = vi.hoisted(() => {
  const mockBallBody = {
    translation: () => ({ x: 1, y: 0, z: 0 }),
    mass: () => 2,
    applyImpulse: vi.fn(),
  }
  const mockSourceBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
  }

  return {
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
    mockBallBody,
    mockBroadcastEvent: vi.fn(),
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

    expect(mockBroadcastEvent).toHaveBeenCalledWith({
      event_type: "BumperTriangle",
      payload: { ball_id: "ball-s" },
    })
    expect(mockBallBody.applyImpulse).toHaveBeenCalledWith({ x: 4, y: 0, z: 0 }, true)
  })
})

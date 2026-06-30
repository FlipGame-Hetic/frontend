import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Vector3 } from "three"
import type { ScreenEvent } from "@frontend/types"

const { handlers, mockBroadcastEvent, mockSourceBody } = vi.hoisted(() => {
  const mockBroadcastEvent = vi.fn<(event: ScreenEvent) => void>()
  const mockSourceBody = {
    translation: () => ({ x: 2, y: 0, z: -3 }),
  }

  return {
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
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
    onCollisionEnter?: (payload: unknown) => void
    ref?: { current: unknown } | null
  }

  return {
    RigidBody: function rigidBodyMock(props: RigidBodyMockProps) {
      handlers.onCollisionEnter = props.onCollisionEnter ?? null
      if (props.ref && "current" in props.ref) {
        props.ref.current = mockSourceBody
      }
      return null
    },
  }
})

import SlimBumper from "@/components/bumpers/SlimBumper"

const makeBallPayload = () => {
  const ballBody = {
    translation: () => ({ x: 3, y: 0, z: -3 }),
    linvel: () => ({ x: 9, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: vi.fn(),
    setLinvel: vi.fn(),
  }

  return {
    ballBody,
    payload: {
      other: {
        rigidBody: ballBody,
        rigidBodyObject: { name: "ball", userData: { ballId: "ball-slim" } },
      },
    },
  }
}

const callCollision = (payload: unknown) => {
  if (!handlers.onCollisionEnter) throw new Error("Expected SlimBumper collision handler")
  handlers.onCollisionEnter(payload)
}

describe("SlimBumper — handleCollision", () => {
  beforeEach(() => {
    handlers.onCollisionEnter = null
    mockBroadcastEvent.mockReset()
  })

  it("broadcasts BallHit haptics and keeps the score event", () => {
    render(
      <SlimBumper
        position={[2, 0, -3]}
        meshOverride={{ name: "r_bumper_slim", scale: new Vector3(1, 1, 1) } as never}
      />,
    )

    const { ballBody, payload } = makeBallPayload()
    callCollision(payload)

    const hapticEvent = mockBroadcastEvent.mock.calls[0]?.[0]
    expect(hapticEvent).toMatchObject({
      event_type: "BallHit",
      payload: {
        hits: [
          {
            id: "r_bumper_slim",
            type: "bumper",
            position: { x: 2, z: -3 },
          },
        ],
      },
    })
    if (hapticEvent?.event_type !== "BallHit") {
      throw new Error("Expected first broadcast to be a BallHit event")
    }
    expect(typeof hapticEvent.payload.hits[0]?.force).toBe("number")

    expect(mockBroadcastEvent).toHaveBeenNthCalledWith(2, {
      event_type: "Bumper",
      payload: { ball_id: "ball-slim" },
    })
    expect(ballBody.applyImpulse).toHaveBeenCalledOnce()
  })
})

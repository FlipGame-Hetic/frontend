import { render } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const { handlers, mockBody } = vi.hoisted(() => {
  const mockBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: vi.fn(),
    linvel: () => ({ x: 5, y: 0, z: 5 }),
    setLinvel: vi.fn(),
  }

  return {
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
    mockBody,
  }
})

vi.mock("@frontend/ws", () => ({
  broadcastEvent: vi.fn(),
  registerScreenSender: vi.fn(),
}))

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
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

import Bumper from "@/components/bumpers/Bumper"

const makePayload = (name = "ball", ballId = "ball-a") => ({
  other: {
    rigidBody: {
      translation: () => ({ x: 1, y: 0, z: 1 }),
      mass: () => 1,
      applyImpulse: vi.fn(),
      linvel: () => ({ x: 5, y: 0, z: 5 }),
      setLinvel: vi.fn(),
    },
    rigidBodyObject: { name, userData: { ballId } },
  },
})

const callCollision = (payload = makePayload()) => {
  if (!handlers.onCollisionEnter) throw new Error("Expected Bumper collision handler")
  handlers.onCollisionEnter(payload)
}

describe("Bumper — bonus hit hook", () => {
  beforeEach(() => {
    handlers.onCollisionEnter = null
  })

  it("notifies bonus hits after a valid bumper collision", () => {
    const onBonusHit = vi.fn()

    render(<Bumper position={[0, 0, 0]} onBonusHit={onBonusHit} />)
    callCollision()

    expect(onBonusHit).toHaveBeenCalledWith("ball-a")
  })

  it("does not notify bonus hits for non-ball collisions", () => {
    const onBonusHit = vi.fn()

    render(<Bumper position={[0, 0, 0]} onBonusHit={onBonusHit} />)
    callCollision(makePayload("wall"))

    expect(onBonusHit).not.toHaveBeenCalled()
  })
})

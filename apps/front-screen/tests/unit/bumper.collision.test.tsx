import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

/**
 * Tests for Bumper.tsx — specifically the collision handler that
 * fires when a physics body enters the bumper's collider.
 *
 * The 3D/physics stack (R3F, Rapier, Leva) is mocked entirely so
 * these run in happy-dom without a WebGL context.
 *
 * Strategy:
 *  - RigidBody is mocked as a lowercase function so that the
 *    react-hooks/immutability rule does not flag external state writes
 *    (ESLint's React Compiler rules only apply to PascalCase components).
 *  - The mock sets bodyRef.current and captures onCollisionEnter directly
 *    during render, which is correct because React 19 passes ref as a
 *    regular prop to function components.
 *  - Tests trigger collisions through callHandler(), which fails loudly
 *    if the handler was not captured.
 */

// ─── Hoisted mock values ─────────────────────────────────────────────────────
// vi.hoisted executes before all imports/mocks so these values can be safely
// referenced inside vi.mock() factory closures.

const { mockSendBumperHit, handlers, mockApplyImpulse, mockBody } = vi.hoisted(() => {
  const mockApplyImpulse = vi.fn()
  const mockBody = {
    translation: () => ({ x: 0, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: mockApplyImpulse,
    linvel: () => ({ x: 5, y: 0, z: 5 }), // non-zero so anti-stuck path clears
  }

  return {
    mockSendBumperHit: vi.fn(),
    handlers: { onCollisionEnter: null as ((payload: unknown) => void) | null },
    mockApplyImpulse,
    mockBody,
  }
})

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock("@/stores/screenSender", () => ({
  sendBumperHit: mockSendBumperHit,
}))

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}))

vi.mock("leva", () => ({
  useControls: () => ({
    restitution: 0.3,
    impulseStrength: 15,
    stuckFrames: 30,
    stuckVelocity: 0.5,
    unstickImpulse: 5,
  }),
}))

// RigidBody mock — lowercase function name.
//
// react-hooks/immutability (React Compiler ESLint rule v7) flags mutations of
// module-scope variables inside PascalCase component functions, even in effects.
// A lowercase function name is not recognised as a React component by the
// linter, so the rule does not apply here, which is exactly what we want for
// test infrastructure that intentionally captures external state.
//
// In React 19, ref is passed as a regular prop to function components, so the
// ref from <RigidBody ref={bodyRef}> is accessible as props.ref here.
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

// ─── Import component under test (after all mocks are declared) ──────────────

import Bumper from "@/components/bumbers/Bumper"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Asserts the collision handler was captured then calls it. */
function callHandler(payload: unknown): void {
  if (handlers.onCollisionEnter === null) {
    throw new Error("onCollisionEnter was not captured — did you render <Bumper>?")
  }
  handlers.onCollisionEnter(payload)
}

/** Builds a minimal CollisionEnterPayload where the other body is a named object. */
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
            },
      rigidBodyObject:
        overrides?.rigidBodyObject !== undefined
          ? overrides.rigidBodyObject
          : { name: overrides?.name ?? "ball" },
    },
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Bumper — handleCollision", () => {
  beforeEach(() => {
    mockSendBumperHit.mockReset()
    mockApplyImpulse.mockReset()
    handlers.onCollisionEnter = null
  })

  // ── Success ────────────────────────────────────────────────────────────────

  describe("success — ball collision", () => {
    it("calls sendBumperHit exactly once when the ball hits the bumper", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={3} />)

      callHandler(makeBallPayload())

      expect(mockSendBumperHit).toHaveBeenCalledOnce()
    })

    it("passes the correct bumperId to sendBumperHit", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={3} />)

      callHandler(makeBallPayload())

      expect(mockSendBumperHit).toHaveBeenCalledWith(3)
    })

    it("passes each bumper's index as its bumperId", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)
      callHandler(makeBallPayload())
      expect(mockSendBumperHit).toHaveBeenLastCalledWith(0)

      mockSendBumperHit.mockReset()

      render(<Bumper position={[0, 0, 0]} bumperId={8} />)
      callHandler(makeBallPayload())
      expect(mockSendBumperHit).toHaveBeenLastCalledWith(8)
    })
  })

  // ── Error — wrong collider type ────────────────────────────────────────────

  describe("error — non-ball collision", () => {
    it("does not call sendBumperHit when the collider is a wall", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)

      callHandler(makeBallPayload({ name: "wall" }))

      expect(mockSendBumperHit).not.toHaveBeenCalled()
    })

    it("does not call sendBumperHit when the collider is a gutter", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)

      callHandler(makeBallPayload({ name: "gutter" }))

      expect(mockSendBumperHit).not.toHaveBeenCalled()
    })

    it("does not call sendBumperHit when rigidBodyObject is null (sensor collider)", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={0} />)

      // optional chaining gives undefined → name check fails
      callHandler(makeBallPayload({ rigidBodyObject: null }))

      expect(mockSendBumperHit).not.toHaveBeenCalled()
    })
  })

  // ── Edge — missing rigidBody on other object ───────────────────────────────

  describe("edge — missing rigidBody on other object", () => {
    it("returns early and does not call sendBumperHit when other.rigidBody is null", () => {
      render(<Bumper position={[0, 0, 0]} bumperId={2} />)

      // Guard: if (!bodyRef.current || !other.rigidBody) return
      callHandler(makeBallPayload({ rigidBody: null }))

      expect(mockSendBumperHit).not.toHaveBeenCalled()
    })
  })

  // ── Exception ──────────────────────────────────────────────────────────────

  describe("exception — sendBumperHit throws", () => {
    it("propagates the exception to the collision handler caller", () => {
      mockSendBumperHit.mockImplementationOnce(() => {
        throw new Error("send failed: socket not ready")
      })
      render(<Bumper position={[0, 0, 0]} bumperId={1} />)

      expect(() => {
        callHandler(makeBallPayload())
      }).toThrow("send failed: socket not ready")
    })

    it("does not silently swallow the error", () => {
      const cause = new TypeError("JSON serialization error")
      mockSendBumperHit.mockImplementationOnce(() => {
        throw cause
      })
      render(<Bumper position={[0, 0, 0]} bumperId={4} />)

      expect(() => {
        callHandler(makeBallPayload())
      }).toThrow(cause)
    })
  })
})

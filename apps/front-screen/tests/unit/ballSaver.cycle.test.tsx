import { act, cleanup, render } from "@testing-library/react"
import { BoxGeometry, Mesh } from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  BALL_SAVER_COOLDOWN_MS,
  BALL_SAVER_MIN_CONTACT_DURATION_MS,
  BALL_SAVER_POST_EXIT_DELAY_MS,
  BALL_SAVER_RAISE_DURATION_MS,
  BALL_SAVER_RETRACT_DURATION_MS,
  BALL_SAVER_TARGET_IDS,
  type BallSaverSide,
} from "@/components/ballSavers/ballSaverConfig"

const { handlers, mockBody, mockSetEnabled } = vi.hoisted(() => {
  const mockSetEnabled = vi.fn()
  const mockCollider = { setEnabled: mockSetEnabled }
  const setNextKinematicTranslation =
    vi.fn<(translation: { x: number; y: number; z: number }) => void>()
  const mockBody = {
    numColliders: vi.fn(() => 1),
    collider: vi.fn(() => mockCollider),
    setNextKinematicTranslation,
  }

  return {
    handlers: {
      frame: null as (() => void) | null,
      onCollisionEnter: null as ((payload: unknown) => void) | null,
      onCollisionExit: null as ((payload: unknown) => void) | null,
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
    onCollisionExit?: (p: unknown) => void
    ref?: { current: unknown } | null
    [key: string]: unknown
  }

  return {
    RigidBody: function rigidBodyMock(props: RigidBodyMockProps) {
      handlers.onCollisionEnter = props.onCollisionEnter ?? null
      handlers.onCollisionExit = props.onCollisionExit ?? null
      handlers.rigidBodyProps = props
      if (props.ref && "current" in props.ref) {
        props.ref.current = mockBody
      }
      return null
    },
  }
})

import BallSaver from "@/components/ballSavers/BallSaver"
import useBallSaverPhaseStore, { INITIAL_BALL_SAVER_PHASES } from "@/stores/useBallSaverPhaseStore"
import useTargetStore from "@/stores/useTargetStore"

let currentTime = 1000
let nowSpy: { mockRestore: () => void } | null = null

function makeSaverMesh(name = "l_ball_saver") {
  const mesh = new Mesh(new BoxGeometry(0.5, 0.36, 0.08))
  mesh.name = name
  return mesh
}

function renderSaver(side: BallSaverSide = "left") {
  return render(
    <BallSaver
      mesh={makeSaverMesh(`${side}_ball_saver`)}
      side={side}
      worldPosition={[side === "left" ? -1 : 1, 0, 0]}
    />,
  )
}

function runFrame() {
  if (handlers.frame === null) {
    throw new Error("useFrame callback was not captured — did you render <BallSaver>?")
  }
  act(() => {
    handlers.frame?.()
  })
}

function activateTargets(ids: readonly string[]) {
  act(() => {
    ids.forEach((id) => {
      useTargetStore.getState().activateTarget(id)
    })
  })
}

function activateSide(side: BallSaverSide) {
  activateTargets(BALL_SAVER_TARGET_IDS[side])
}

function makeBallPayload(ballId: string) {
  return {
    other: {
      rigidBody: { handle: ballId },
      rigidBodyObject: {
        name: "ball",
        userData: { ballId },
        uuid: `ball-${ballId}`,
      },
    },
  }
}

function callCollisionEnter(ballId = "a") {
  if (handlers.onCollisionEnter === null) {
    throw new Error("onCollisionEnter was not captured — did you render <BallSaver>?")
  }
  act(() => {
    handlers.onCollisionEnter?.(makeBallPayload(ballId))
  })
}

function callCollisionExit(ballId = "a") {
  if (handlers.onCollisionExit === null) {
    throw new Error("onCollisionExit was not captured — did you render <BallSaver>?")
  }
  act(() => {
    handlers.onCollisionExit?.(makeBallPayload(ballId))
  })
}

/** Ball saver ignores saves shorter than BALL_SAVER_MIN_CONTACT_DURATION_MS. */
function holdBallContact(ballId = "a") {
  callCollisionEnter(ballId)
  currentTime += BALL_SAVER_MIN_CONTACT_DURATION_MS
  callCollisionExit(ballId)
}

function activateSaver(side: BallSaverSide = "left") {
  renderSaver(side)
  activateSide(side)
  currentTime += BALL_SAVER_RAISE_DURATION_MS
  runFrame()
  mockSetEnabled.mockClear()
  mockBody.setNextKinematicTranslation.mockClear()
}

describe("BallSaver — target-linked cycle", () => {
  beforeEach(() => {
    cleanup()
    nowSpy?.mockRestore()
    currentTime = 1000
    nowSpy = vi.spyOn(performance, "now").mockImplementation(() => currentTime)

    mockSetEnabled.mockReset()
    mockBody.numColliders.mockClear()
    mockBody.collider.mockClear()
    mockBody.setNextKinematicTranslation.mockClear()
    handlers.frame = null
    handlers.onCollisionEnter = null
    handlers.onCollisionExit = null
    handlers.rigidBodyProps = null
    useBallSaverPhaseStore.setState({ phases: INITIAL_BALL_SAVER_PHASES })
    useTargetStore.setState({ activatedTargetIds: [], targetHits: [] })
  })

  afterEach(() => {
    cleanup()
    nowSpy?.mockRestore()
    nowSpy = null
  })

  it("starts retracted and intangible while its side targets are raised", () => {
    renderSaver("left")
    runFrame()

    expect(mockSetEnabled).toHaveBeenCalledWith(false)
    const translation = mockBody.setNextKinematicTranslation.mock.lastCall?.[0]
    if (translation === undefined) {
      throw new Error("Expected the ball saver to update its kinematic translation")
    }
    expect(translation.y).toBeLessThan(0)
  })

  it("raises and becomes tangible only when every linked target is down", () => {
    renderSaver("left")
    mockSetEnabled.mockClear()

    const requiredTargets = [...BALL_SAVER_TARGET_IDS.left]
    const finalTargetId = requiredTargets.pop()
    if (!finalTargetId) throw new Error("left ball saver has no linked targets")

    activateTargets(requiredTargets)
    currentTime += BALL_SAVER_RAISE_DURATION_MS
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(true)

    activateTargets([finalTargetId])
    currentTime += BALL_SAVER_RAISE_DURATION_MS
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledWith(true)
  })

  it("keeps left and right target groups independent", () => {
    renderSaver("left")
    mockSetEnabled.mockClear()

    activateSide("right")
    currentTime += BALL_SAVER_RAISE_DURATION_MS
    runFrame()

    expect(mockSetEnabled).not.toHaveBeenCalledWith(true)
  })

  it("consumes protection after collision exit plus the safety delay", () => {
    activateSaver("left")

    holdBallContact("a")

    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS - 1
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)

    currentTime += 1
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledWith(false)
  })

  it("cancels the pending consume delay when the ball touches the saver again", () => {
    activateSaver("left")

    holdBallContact("a")

    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS - 10
    callCollisionEnter("b")

    currentTime += 20
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)

    currentTime += BALL_SAVER_MIN_CONTACT_DURATION_MS
    callCollisionExit("b")
    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS - 1
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)

    currentTime += 1
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledTimes(1)
    expect(mockSetEnabled).toHaveBeenCalledWith(false)
  })

  it("waits for all active ball contacts before consuming a multiball save", () => {
    activateSaver("left")

    callCollisionEnter("a")
    callCollisionEnter("b")
    callCollisionExit("a")

    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS
    runFrame()
    expect(mockSetEnabled).not.toHaveBeenCalledWith(false)

    callCollisionExit("b")
    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS
    runFrame()
    expect(mockSetEnabled).toHaveBeenCalledTimes(1)
    expect(mockSetEnabled).toHaveBeenCalledWith(false)
  })

  it("resets only the consumed side targets after retraction and cooldown", () => {
    activateSaver("left")
    activateSide("right")

    holdBallContact("a")
    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS
    runFrame()

    currentTime += BALL_SAVER_RETRACT_DURATION_MS
    runFrame()

    currentTime += BALL_SAVER_COOLDOWN_MS - 1
    runFrame()
    expect(useTargetStore.getState().activatedTargetIds).toEqual(
      expect.arrayContaining([...BALL_SAVER_TARGET_IDS.left, ...BALL_SAVER_TARGET_IDS.right]),
    )

    currentTime += 1
    runFrame()
    expect(useTargetStore.getState().activatedTargetIds).not.toEqual(
      expect.arrayContaining([...BALL_SAVER_TARGET_IDS.left]),
    )
    expect(useTargetStore.getState().activatedTargetIds).toEqual(
      expect.arrayContaining([...BALL_SAVER_TARGET_IDS.right]),
    )
  })

  it("marks the status text consumed until the side targets reset", () => {
    activateSaver("left")
    expect(useBallSaverPhaseStore.getState().phases.left).toBe("active")

    holdBallContact("a")
    currentTime += BALL_SAVER_POST_EXIT_DELAY_MS
    runFrame()
    expect(useBallSaverPhaseStore.getState().phases.left).toBe("retracting")

    currentTime += BALL_SAVER_RETRACT_DURATION_MS
    runFrame()
    expect(useBallSaverPhaseStore.getState().phases.left).toBe("cooldown")

    currentTime += BALL_SAVER_COOLDOWN_MS
    runFrame()
    expect(useBallSaverPhaseStore.getState().phases.left).toBe("down")
    expect(useTargetStore.getState().activatedTargetIds).not.toEqual(
      expect.arrayContaining([...BALL_SAVER_TARGET_IDS.left]),
    )
  })
})

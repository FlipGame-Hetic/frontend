import { Fragment, useMemo } from "react"
import useBallSaverPhaseStore from "@/stores/useBallSaverPhaseStore"
import BallSaver from "../ballSavers/BallSaver"
import BallSaverStatusText from "../ballSavers/BallSaverStatusText"
import { getBallSaverSideFromWorldPosition } from "../ballSavers/ballSaverConfig"
import type { BallSaverSide } from "../ballSavers/ballSaverConfig"
import { getWorldPosition, type PlayfieldNodes } from "./usePlayfieldModel"

const BallSaverStatusTextForSide = ({ side }: { side: BallSaverSide }) => {
  const phase = useBallSaverPhaseStore((state) => state.phases[side])

  return <BallSaverStatusText side={side} phase={phase} />
}

const GlbBallSaversManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const ballSavers = useMemo(
    () =>
      nodes.ballSavers.map((mesh) => {
        const worldPosition = getWorldPosition(mesh)
        return {
          mesh,
          side: getBallSaverSideFromWorldPosition(worldPosition),
          worldPosition,
        }
      }),
    [nodes],
  )

  return (
    <>
      {ballSavers.map(({ mesh, side, worldPosition }) => (
        <Fragment key={mesh.uuid}>
          <BallSaverStatusTextForSide side={side} />
          <BallSaver mesh={mesh} side={side} worldPosition={worldPosition} />
        </Fragment>
      ))}
    </>
  )
}

export default GlbBallSaversManager

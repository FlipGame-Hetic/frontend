import { Fragment, useMemo } from "react"
import useBallSaverPhaseStore from "@/stores/useBallSaverPhaseStore"
import { getWorldPosition, type PlayfieldNodes } from "../playfield/usePlayfieldModel"
import BallSaver from "./BallSaver"
import BallSaverStatusText from "./BallSaverStatusText"
import { getBallSaverSideFromWorldPosition } from "./ballSaverConfig"
import type { BallSaverSide } from "./ballSaverConfig"

const BallSaverStatusTextForSide = ({ side }: { side: BallSaverSide }) => {
  const phase = useBallSaverPhaseStore((state) => state.phases[side])

  return <BallSaverStatusText side={side} phase={phase} />
}

const BallSaversManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
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

export default BallSaversManager

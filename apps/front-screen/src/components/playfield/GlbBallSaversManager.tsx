import { useMemo } from "react"
import BallSaver from "../ballSavers/BallSaver"
import { getBallSaverSideFromWorldPosition } from "../ballSavers/ballSaverConfig"
import { getWorldPosition, type PlayfieldNodes } from "./usePlayfieldModel"

export default function GlbBallSaversManager({ nodes }: { nodes: PlayfieldNodes }) {
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
        <BallSaver key={mesh.uuid} mesh={mesh} side={side} worldPosition={worldPosition} />
      ))}
    </>
  )
}

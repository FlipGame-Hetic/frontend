import GlbAnimatedGroups from "./GlbAnimatedGroups"
import GlbBallSaversManager from "./GlbBallSaversManager"
import GlbBumpersManager from "./GlbBumpersManager"
import GlbFlippers from "./GlbFlippers"
import GlbPlunger from "./GlbPlunger"
import GlbSlimBumpersManager from "./GlbSlimBumpersManager"
import GlbSlingshotsManager from "./GlbSlingshotsManager"
import GlbTargetsManager from "./GlbTargetsManager"
import MultiballGate from "./MultiballGate"
import StaticPlayfield from "./StaticPlayfield"
import { usePlayfieldModel } from "./usePlayfieldModel"

const PlayfieldScene = () => {
  const { nodes, animations } = usePlayfieldModel()
  return (
    <>
      <StaticPlayfield nodes={nodes} />
      <GlbAnimatedGroups nodes={nodes} animations={animations} />
      <MultiballGate nodes={nodes} />
      <GlbBumpersManager nodes={nodes} />
      <GlbSlimBumpersManager nodes={nodes} />
      <GlbSlingshotsManager nodes={nodes} />
      <GlbFlippers nodes={nodes} />
      <GlbTargetsManager nodes={nodes} />
      <GlbBallSaversManager nodes={nodes} />
      <GlbPlunger nodes={nodes} />
    </>
  )
}

export default PlayfieldScene

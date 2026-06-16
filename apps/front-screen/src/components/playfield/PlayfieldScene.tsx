import { usePlayfieldModel } from "./usePlayfieldModel"
import StaticPlayfield from "./StaticPlayfield"
import GlbBumpersManager from "./GlbBumpersManager"
import GlbSlimBumpersManager from "./GlbSlimBumpersManager"
import GlbSlingshotsManager from "./GlbSlingshotsManager"
import GlbFlippers from "./GlbFlippers"
import GlbTargetsManager from "./GlbTargetsManager"
import GlbPlunger from "./GlbPlunger"
import GlbSpinnerManager from "./GlbSpinnerManager"
import GlbBallSaversManager from "./GlbBallSaversManager"
import MultiballGate from "./MultiballGate"

const PlayfieldScene = () => {
  const nodes = usePlayfieldModel()
  return (
    <>
      <StaticPlayfield nodes={nodes} />
      <MultiballGate nodes={nodes} />
      <GlbBumpersManager nodes={nodes} />
      <GlbSlimBumpersManager nodes={nodes} />
      <GlbSlingshotsManager nodes={nodes} />
      <GlbFlippers nodes={nodes} />
      <GlbTargetsManager nodes={nodes} />
      <GlbBallSaversManager nodes={nodes} />
      <GlbPlunger nodes={nodes} />
      <GlbSpinnerManager nodes={nodes} />
    </>
  )
}

export default PlayfieldScene

import { usePlayfieldModel } from "./usePlayfieldModel"
import StaticPlayfield from "./StaticPlayfield"
import GlbBumpersManager from "./GlbBumpersManager"
import GlbSlimBumpersManager from "./GlbSlimBumpersManager"
import GlbSlingshotsManager from "./GlbSlingshotsManager"
import GlbFlippers from "./GlbFlippers"
import GlbTargetsManager from "./GlbTargetsManager"

export default function PlayfieldScene() {
  const nodes = usePlayfieldModel()
  return (
    <>
      <StaticPlayfield nodes={nodes} />
      <GlbBumpersManager nodes={nodes} />
      <GlbSlimBumpersManager nodes={nodes} />
      <GlbSlingshotsManager nodes={nodes} />
      <GlbFlippers nodes={nodes} />
      <GlbTargetsManager nodes={nodes} />
    </>
  )
}

import type { AnimationClip } from "three"
import { type PlayfieldNodes } from "../usePlayfieldModel"
import AnimatedGroup from "./AnimatedGroup"
import { GLOBE_GROUP_NAME } from "./decorationConfig"

const AnimatedGroupsManager = ({
  nodes,
  animations,
}: {
  nodes: PlayfieldNodes
  animations: AnimationClip[]
}) => {
  return (
    <>
      {nodes.animatedGroups
        .filter((group) => group.name === GLOBE_GROUP_NAME)
        .map((group) => (
          <AnimatedGroup key={group.uuid} source={group} animations={animations} />
        ))}
    </>
  )
}

export default AnimatedGroupsManager

import { useAnimations } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import type { AnimationClip, Object3D } from "three"
import { LoopRepeat, PropertyBinding } from "three"
import { applyGlobeBloomMaterialConfig } from "./decorationMaterials"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"

const GLOBE_GROUP_NAME = "globe"

const getObjectNames = (object: Object3D): Set<string> => {
  const names = new Set<string>()
  object.traverse((node) => {
    if (node.name) names.add(node.name)
  })
  return names
}

const getTrackNodeName = (trackName: string): string | undefined => {
  try {
    return PropertyBinding.parseTrackName(trackName).nodeName
  } catch {
    return undefined
  }
}

const targetsObject = (clip: AnimationClip, objectNames: Set<string>): boolean => {
  return clip.tracks.some((track) => {
    const nodeName = getTrackNodeName(track.name)
    return nodeName !== undefined && objectNames.has(nodeName)
  })
}

const AnimatedGroup = ({
  source,
  animations,
}: {
  source: Object3D
  animations: AnimationClip[]
}) => {
  const object = useMemo(() => {
    const clone = cloneAtWorldTransform(source)
    applyGlobeBloomMaterialConfig(clone)
    return clone
  }, [source])
  const clips = useMemo(() => {
    const objectNames = getObjectNames(object)
    return animations.filter((clip) => targetsObject(clip, objectNames))
  }, [animations, object])
  const { actions } = useAnimations(clips, object)

  useEffect(() => {
    const activeActions = clips.flatMap((clip) => {
      const action = actions[clip.name]
      return action ? [action] : []
    })

    for (const action of activeActions) {
      action.reset().setLoop(LoopRepeat, Infinity).play()
    }

    return () => {
      for (const action of activeActions) {
        action.stop()
      }
    }
  }, [actions, clips])

  return <primitive object={object} />
}

const GlbAnimatedGroups = ({
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

export default GlbAnimatedGroups

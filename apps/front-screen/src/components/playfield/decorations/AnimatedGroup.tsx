import { useAnimations } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import { LoopRepeat, PropertyBinding, type AnimationClip, type Object3D } from "three"
import { cloneAtWorldTransform } from "../usePlayfieldModel"
import { applyGlobeBloomMaterialConfig } from "./decorationMaterials"

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

// Only the animations whose track targets an existing node in the clone
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

export default AnimatedGroup

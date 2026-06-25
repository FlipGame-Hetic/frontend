import {
  MULTIBALL_TRIGGER_POPUP_DURATION,
  MULTIBALL_TRIGGER_POPUP_FADE_OUT_START,
  MULTIBALL_TRIGGER_POPUP_SCALE_END,
  MULTIBALL_TRIGGER_POPUP_SCALE_HIT,
  MULTIBALL_TRIGGER_POPUP_SCALE_HIT_PROGRESS,
  MULTIBALL_TRIGGER_POPUP_SCALE_START,
  SCORE_POPUP_RISE_HEIGHT,
} from "../scorePopupConfig"
import { easeOutBack, easeOutCubic } from "@/utils/easing"
import PopupTextStack from "../text/PopupTextStack"

interface MultiballPopupProps {
  id: number
  position: { x: number; y: number; z: number }
  color: string
  text: string
}

const getMultiballTriggerScale = (progress: number): number => {
  if (progress < MULTIBALL_TRIGGER_POPUP_SCALE_HIT_PROGRESS) {
    return (
      MULTIBALL_TRIGGER_POPUP_SCALE_START +
      easeOutBack(progress / MULTIBALL_TRIGGER_POPUP_SCALE_HIT_PROGRESS) *
        (MULTIBALL_TRIGGER_POPUP_SCALE_HIT - MULTIBALL_TRIGGER_POPUP_SCALE_START)
    )
  }

  const settleProgress =
    (progress - MULTIBALL_TRIGGER_POPUP_SCALE_HIT_PROGRESS) /
    (1 - MULTIBALL_TRIGGER_POPUP_SCALE_HIT_PROGRESS)

  return (
    MULTIBALL_TRIGGER_POPUP_SCALE_HIT +
    easeOutCubic(Math.min(1, settleProgress)) *
      (MULTIBALL_TRIGGER_POPUP_SCALE_END - MULTIBALL_TRIGGER_POPUP_SCALE_HIT)
  )
}

const MultiballPopup = ({ id, position, color, text }: MultiballPopupProps) => {
  return (
    <PopupTextStack
      id={id}
      color={color}
      duration={MULTIBALL_TRIGGER_POPUP_DURATION}
      fadeOutStart={MULTIBALL_TRIGGER_POPUP_FADE_OUT_START}
      fillOpacity={1}
      getScale={getMultiballTriggerScale}
      position={position}
      riseHeight={SCORE_POPUP_RISE_HEIGHT * 0.25}
      shouldGlitch
      text={text}
    />
  )
}

export default MultiballPopup

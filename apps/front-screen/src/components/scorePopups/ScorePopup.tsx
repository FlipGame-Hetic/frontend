import {
  SCORE_POPUP_DURATION,
  SCORE_POPUP_FADE_OUT_START,
  SCORE_POPUP_GLITCH_THRESHOLD,
  SCORE_POPUP_RISE_HEIGHT,
  getScorePopupColor,
  getScorePopupFillOpacity,
} from "./scorePopupConfig"
import PopupTextStack from "./PopupTextStack"

interface ScorePopupProps {
  id: number
  amount: number
  position: { x: number; y: number; z: number }
  color: string
}

const ScorePopup = ({ id, amount, position, color: targetColor }: ScorePopupProps) => {
  const amountText = amount.toString()
  const text = amount >= 0 ? `+${amountText}` : amountText

  return (
    <PopupTextStack
      id={id}
      color={getScorePopupColor(amount, targetColor)}
      duration={SCORE_POPUP_DURATION}
      fadeOutStart={SCORE_POPUP_FADE_OUT_START}
      fillOpacity={getScorePopupFillOpacity(amount)}
      position={position}
      riseHeight={SCORE_POPUP_RISE_HEIGHT}
      shouldGlitch={amount >= SCORE_POPUP_GLITCH_THRESHOLD}
      text={text}
    />
  )
}

export default ScorePopup

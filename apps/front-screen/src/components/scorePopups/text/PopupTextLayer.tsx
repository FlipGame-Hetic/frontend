import { Text } from "@react-three/drei"
import type { PopupTextLayerRole } from "./popupTextMaterial"
import {
  SCORE_POPUP_FONT,
  SCORE_POPUP_FONT_SIZE,
  SCORE_POPUP_LETTER_SPACING,
  SCORE_POPUP_OUTLINE_COLOR,
  SCORE_POPUP_OUTLINE_WIDTH,
} from "../scorePopupConfig"

interface PopupTextLayerProps {
  children: string
  color: string
  depthTest?: boolean
  fontSize?: number
  letterSpacing?: number
  opacity: number
  outlineColor?: string
  outlineWidth?: number
  renderOrder: number
  role: PopupTextLayerRole
  toneMapped?: boolean
}

const PopupTextLayer = ({
  children,
  color,
  depthTest,
  fontSize = SCORE_POPUP_FONT_SIZE,
  letterSpacing = SCORE_POPUP_LETTER_SPACING,
  opacity,
  outlineColor = SCORE_POPUP_OUTLINE_COLOR,
  outlineWidth = SCORE_POPUP_OUTLINE_WIDTH,
  renderOrder,
  role,
  toneMapped,
}: PopupTextLayerProps) => {
  return (
    <Text
      font={SCORE_POPUP_FONT}
      fontSize={fontSize}
      letterSpacing={letterSpacing}
      color={color}
      outlineWidth={outlineWidth}
      outlineColor={outlineColor}
      renderOrder={renderOrder}
      userData={{ scorePopupOpacity: opacity, scorePopupRole: role }}
      material-transparent
      material-depthWrite={false}
      material-depthTest={depthTest}
      material-toneMapped={toneMapped}
      fillOpacity={1}
      outlineOpacity={0}
    >
      {children}
    </Text>
  )
}

export default PopupTextLayer

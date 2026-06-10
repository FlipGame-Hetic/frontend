import { Grid } from "@react-three/drei"
import { useControls } from "leva"
import { useMemo } from "react"
import * as THREE from "three"
import {
  TRON_CELL_COLOR,
  TRON_CELL_SIZE,
  TRON_CELL_THICKNESS,
  TRON_FADE_DISTANCE,
  TRON_FADE_STRENGTH,
  TRON_GRID_POSITION_Y,
  TRON_GRID_SIZE,
  TRON_HDR_FACTOR,
  TRON_SECTION_COLOR,
  TRON_SECTION_SIZE,
  TRON_SECTION_THICKNESS,
} from "./tronGridConfig"

const TronGridFloor = () => {
  const {
    positionY,
    cellSize,
    sectionSize,
    cellThickness,
    sectionThickness,
    cellColorHex,
    sectionColorHex,
    fadeDistance,
    fadeStrength,
    hdrFactor,
  } = useControls("Tron Grid", {
    positionY: { value: TRON_GRID_POSITION_Y, min: -10, max: 5, step: 0.1 },
    cellSize: { value: TRON_CELL_SIZE, min: 0.1, max: 10, step: 0.1 },
    sectionSize: { value: TRON_SECTION_SIZE, min: 1, max: 20, step: 1 },
    cellThickness: { value: TRON_CELL_THICKNESS, min: 0, max: 5, step: 0.1 },
    sectionThickness: { value: TRON_SECTION_THICKNESS, min: 0, max: 10, step: 0.1 },
    cellColorHex: { value: TRON_CELL_COLOR, label: "cellColor" },
    sectionColorHex: { value: TRON_SECTION_COLOR, label: "sectionColor" },
    fadeDistance: { value: TRON_FADE_DISTANCE, min: 5, max: 100, step: 1 },
    fadeStrength: { value: TRON_FADE_STRENGTH, min: 0, max: 5, step: 0.1 },
    hdrFactor: { value: TRON_HDR_FACTOR, min: 0.5, max: 5, step: 0.05 },
  })

  const cellColor = useMemo(
    () => new THREE.Color(cellColorHex).multiplyScalar(hdrFactor),
    [cellColorHex, hdrFactor],
  )
  const sectionColor = useMemo(
    () => new THREE.Color(sectionColorHex).multiplyScalar(hdrFactor),
    [sectionColorHex, hdrFactor],
  )

  return (
    <Grid
      args={[TRON_GRID_SIZE, TRON_GRID_SIZE]}
      position={[0, positionY, 0]}
      cellSize={cellSize}
      cellColor={cellColor}
      cellThickness={cellThickness}
      sectionSize={sectionSize}
      sectionColor={sectionColor}
      sectionThickness={sectionThickness}
      fadeDistance={fadeDistance}
      fadeStrength={fadeStrength}
      infiniteGrid
    />
  )
}

export default TronGridFloor

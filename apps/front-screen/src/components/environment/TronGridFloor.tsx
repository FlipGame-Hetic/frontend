import { Grid } from "@react-three/drei"
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
  const cellColor = useMemo(
    () => new THREE.Color(TRON_CELL_COLOR).multiplyScalar(TRON_HDR_FACTOR),
    [],
  )
  const sectionColor = useMemo(
    () => new THREE.Color(TRON_SECTION_COLOR).multiplyScalar(TRON_HDR_FACTOR),
    [],
  )

  return (
    <Grid
      args={[TRON_GRID_SIZE, TRON_GRID_SIZE]}
      position={[0, TRON_GRID_POSITION_Y, 0]}
      cellSize={TRON_CELL_SIZE}
      cellColor={cellColor}
      cellThickness={TRON_CELL_THICKNESS}
      sectionSize={TRON_SECTION_SIZE}
      sectionColor={sectionColor}
      sectionThickness={TRON_SECTION_THICKNESS}
      fadeDistance={TRON_FADE_DISTANCE}
      fadeStrength={TRON_FADE_STRENGTH}
      infiniteGrid
    />
  )
}

export default TronGridFloor

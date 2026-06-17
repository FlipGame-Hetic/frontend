import { Environment } from "@react-three/drei"
import {
  NIGHT_CITY_ENVIRONMENT_INTENSITY,
  NIGHT_CITY_ENVIRONMENT_ROTATION,
  NIGHT_CITY_HDRI_PATH,
} from "./nightCityEnvironmentConfig"

const NightCityEnvironment = () => {
  return (
    <Environment
      files={NIGHT_CITY_HDRI_PATH}
      background={false}
      environmentIntensity={NIGHT_CITY_ENVIRONMENT_INTENSITY}
      environmentRotation={NIGHT_CITY_ENVIRONMENT_ROTATION}
    />
  )
}

export default NightCityEnvironment

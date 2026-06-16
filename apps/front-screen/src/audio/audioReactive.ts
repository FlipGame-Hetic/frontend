import * as THREE from "three"

export interface AudioReactiveState {
  bass: number
  mid: number
  high: number
  energy: number
  swell: number
  beat: number
  dropPulse: number
  color: THREE.Color
}

const state: AudioReactiveState = {
  bass: 0,
  mid: 0,
  high: 0,
  energy: 0,
  swell: 0,
  beat: 0,
  dropPulse: 0,
  color: new THREE.Color(0, 0.94, 1),
}

export const getAudioReactive = (): Readonly<AudioReactiveState> => state

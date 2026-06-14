import * as THREE from "three"
import type { AudioReactiveState } from "@/audio/audioReactive"
import { SPECTRUM_HDR } from "@/audio/audioReactiveConfig"

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uBeat;
  uniform float uSwell;
  uniform vec3 uColor;
  uniform float uHdr;
  varying vec2 vUv;

  void main() {
    float f = vUv.x;
    float dist = abs(vUv.y - 0.5) * 2.0;

    float bassGauss = exp(-pow((f - 0.12) / 0.18, 2.0)) * uBass;
    float midGauss  = exp(-pow((f - 0.45) / 0.22, 2.0)) * uMid;
    float highGauss = exp(-pow((f - 0.78) / 0.17, 2.0)) * uHigh;

    float n1 = 0.5 + 0.5 * sin(f * 26.0 + uTime * 2.2);
    float n2 = 0.5 + 0.5 * sin(f * 11.0 - uTime * 3.1);
    float noise = n1 * n2;

    float spectrum = (bassGauss + midGauss + highGauss) * (0.55 + 0.45 * noise);

    float barHeight = clamp(spectrum, 0.0, 0.95);
    float bars = smoothstep(barHeight + 0.015, barHeight - 0.005, dist);

    float edge = exp(-abs(dist - barHeight) * 35.0) * spectrum * 1.4;
    float glow = exp(-dist * (2.5 / (barHeight + 0.04))) * spectrum * 0.5;

    float line1 = exp(-pow(dist - 0.32 - sin(f * 18.0 + uTime * 0.9) * uMid * 0.12, 2.0) * 600.0) * uMid * 0.6;
    float line2 = exp(-pow(dist - 0.55 - sin(f * 23.0 - uTime * 1.3) * uHigh * 0.08, 2.0) * 900.0) * uHigh * 0.5;
    float line3 = exp(-pow(dist - 0.20 - sin(f * 31.0 + uTime * 0.5) * uBass * 0.15, 2.0) * 500.0) * uBass * 0.7;

    float beatMult = 1.0 + uBeat * 1.8;

    float intensity = (bars * 0.75 + edge * 1.6 + glow * 0.4 + (line1 + line2 + line3) * 0.7) * beatMult;
    intensity *= 0.07 + 0.93 * uSwell;
    intensity = clamp(intensity, 0.0, 2.0);

    float totalBands = bassGauss + midGauss + highGauss + 0.001;
    vec3 bassCol = vec3(0.0, 0.94, 1.0);
    vec3 highCol = vec3(1.0, 0.18, 0.42);
    vec3 blendCol = (bassGauss * bassCol + midGauss * uColor + highGauss * highCol) / totalBands;

    vec3 outColor = blendCol * intensity * uHdr;
    float alpha = clamp(intensity * 0.6, 0.0, 1.0);

    gl_FragColor = vec4(outColor, alpha);
  }
`

export const createAudioSpectrumMaterial = (): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uBeat: { value: 0 },
      uSwell: { value: 0 },
      uColor: { value: new THREE.Color(0, 0.94, 1) },
      uHdr: { value: SPECTRUM_HDR },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

export const updateAudioSpectrumMaterial = (
  material: THREE.ShaderMaterial,
  time: number,
  reactive: Pick<AudioReactiveState, "bass" | "mid" | "high" | "beat" | "swell" | "color">,
): void => {
  const u = material.uniforms
  if (u.uTime) u.uTime.value = time
  if (u.uBass) u.uBass.value = reactive.bass
  if (u.uMid) u.uMid.value = reactive.mid
  if (u.uHigh) u.uHigh.value = reactive.high
  if (u.uBeat) u.uBeat.value = reactive.beat
  if (u.uSwell) u.uSwell.value = reactive.swell
  if (u.uColor) {
    ;(u.uColor.value as THREE.Color).copy(reactive.color)
  }
}

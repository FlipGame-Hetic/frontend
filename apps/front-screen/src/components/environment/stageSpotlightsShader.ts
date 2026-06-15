import * as THREE from "three"
import { SPOTS_OPACITY } from "@/audio/audioReactiveConfig"

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Fine couche god-rays additive : 2 faisceaux diagonaux partant du HAUT,
// teintés par la couleur audio, par-dessus les vraies SpotLight volumétriques.
const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uHdr;
  uniform vec3 uColor;
  varying vec2 vUv;

  float beam(vec2 uv, float cx, float slope, float width, float t) {
    float depth = max(1.08 - uv.y, 0.001);
    float center = cx + slope * depth + sin(t * 0.25) * 0.05;
    float sideOff = abs(uv.x - center);
    float halfW = 0.04 + depth * width;
    float inBeam = smoothstep(halfW, halfW * 0.2, sideOff);
    float falloff = exp(-depth * 1.4);
    float shimmer = 0.7 + 0.3 * sin(depth * 26.0 - t * 3.0);
    return max(0.0, inBeam * falloff * shimmer);
  }

  void main() {
    vec2 uv = vUv;
    float b1 = beam(uv, 0.34, 0.16, 0.10, uTime);
    float b2 = beam(uv, 0.66, -0.16, 0.10, uTime + 2.2);
    float total = b1 + b2;

    vec3 color = uColor * total * uHdr;
    float alpha = clamp(total, 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export const createStageSpotlightsMaterial = (): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: SPOTS_OPACITY },
      uHdr: { value: 1.8 },
      uColor: { value: new THREE.Color(0, 0.94, 1) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  })

export const updateStageSpotlightsMaterial = (
  material: THREE.ShaderMaterial,
  time: number,
  opacity: number,
  color: THREE.Color,
): void => {
  const u = material.uniforms
  if (u.uTime) u.uTime.value = time
  if (u.uOpacity) u.uOpacity.value = opacity
  if (u.uColor) (u.uColor.value as THREE.Color).copy(color)
}

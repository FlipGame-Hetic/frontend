import * as THREE from "three"
import { SPOTS_OPACITY } from "@/audio/audioReactiveConfig"

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uHdr;
  varying vec2 vUv;

  float cone(vec2 uv, float cx, float coneWidth, float t, float sweepSpeed, float sweepAmp) {
    float center = cx + sin(t * sweepSpeed) * sweepAmp;
    vec2 from = vec2(center, -0.08);
    vec2 ray = uv - from;
    float depth = max(ray.y, 0.001);
    float sideOff = abs(ray.x);
    float halfW = depth * coneWidth;
    float inCone = smoothstep(halfW, halfW * 0.25, sideOff);
    float falloff = exp(-length(ray) * 0.9);
    float shimmer = 0.62 + 0.38 * sin(depth * 32.0 - t * 4.5);
    return max(0.0, inCone * falloff * shimmer);
  }

  void main() {
    vec2 uv = vUv;

    float s1 = cone(uv, 0.50, 0.18, uTime, 0.18, 0.28);
    float s2 = cone(uv, 0.22, 0.14, uTime + 1.7, 0.14, 0.22);
    float s3 = cone(uv, 0.78, 0.15, uTime + 3.5, 0.16, 0.25);
    float s4 = cone(uv, 0.38, 0.12, uTime + 0.8, 0.22, 0.20);
    float s5 = cone(uv, 0.62, 0.13, uTime + 2.6, 0.20, 0.18);

    vec3 col1 = vec3(0.0,  0.94, 1.0);
    vec3 col2 = vec3(0.69, 0.15, 1.0);
    vec3 col3 = vec3(1.0,  0.18, 0.42);
    vec3 col4 = vec3(0.0,  0.94, 1.0);
    vec3 col5 = vec3(0.50, 0.0,  1.0);

    vec3 colorSum = s1 * col1 + s2 * col2 + s3 * col3 + s4 * col4 + s5 * col5;
    float total = s1 + s2 + s3 + s4 + s5;

    vec3 color = total > 0.001 ? (colorSum / total) * total : vec3(0.0);
    color *= uHdr;
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
): void => {
  const u = material.uniforms
  if (u.uTime) u.uTime.value = time
  if (u.uOpacity) u.uOpacity.value = opacity
}

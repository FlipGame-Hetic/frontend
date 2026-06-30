import * as THREE from "three"
import {
  BALL_SAVER_HOLO_BASE_ALPHA,
  BALL_SAVER_HOLO_FILL_COLOR,
  BALL_SAVER_HOLO_HDR_FACTOR,
  BALL_SAVER_HOLO_LINE_DENSITY,
  BALL_SAVER_HOLO_RIM_COLOR,
  BALL_SAVER_HOLO_RIM_STRENGTH,
  BALL_SAVER_HOLO_SCROLL_SPEED,
} from "./ballSaverConfig"

// The vertex shader places the mesh and hands the fragment shader the world position for the scan lines plus what the fresnel rim needs
const VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // World position so the scan lines stay horizontal in space, whatever the mesh topology
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    // Normal in view space so the fragment shader can compare it against the camera direction
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    // Direction from this point back toward the camera, used for the fresnel rim
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

// The fragment shader paints the pink fill, scrolls the scan lines and adds a thin white rim
const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uHdr;
  uniform float uBaseAlpha;
  uniform float uLineDensity;
  uniform float uScrollSpeed;
  uniform float uRimStrength;
  uniform vec3 uColorFill;
  uniform vec3 uColorRim;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    // Horizontal scan lines along world Y, scrolling upward to match the status text animation
    float wave = sin((vWorldPos.y * uLineDensity - uTime * uScrollSpeed) * 6.2831853);
    // Thin bright lines over a darker pink base, high contrast so they read as a hologram
    float line = smoothstep(0.1, 0.9, wave);
    vec3 base = uColorFill * 0.4;
    vec3 lit = mix(uColorFill, uColorRim, 0.45);
    vec3 fill = mix(base, lit, line);

    // Fresnel rim, sharp exponent so only near-grazing faces pick up a white edge, flat faces stay pink
    float NdotV = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - NdotV, 4.0);
    vec3 color = fill + uColorRim * fresnel * uRimStrength;

    // Push past 1.0 for a controlled bloom glow without washing the whole face to white
    color *= uHdr;

    // Slightly denser on the rim so the volume reads as a floating hologram
    float alpha = clamp(uBaseAlpha + fresnel * 0.35, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

export const createBallSaverHologramMaterial = (): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHdr: { value: BALL_SAVER_HOLO_HDR_FACTOR },
      uBaseAlpha: { value: BALL_SAVER_HOLO_BASE_ALPHA },
      uLineDensity: { value: BALL_SAVER_HOLO_LINE_DENSITY },
      uScrollSpeed: { value: BALL_SAVER_HOLO_SCROLL_SPEED },
      uRimStrength: { value: BALL_SAVER_HOLO_RIM_STRENGTH },
      uColorFill: { value: new THREE.Color(BALL_SAVER_HOLO_FILL_COLOR) },
      uColorRim: { value: new THREE.Color(BALL_SAVER_HOLO_RIM_COLOR) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    // Semi-opaque surface keeps depth so it reads as a solid volume, no additive blending
    depthWrite: true,
    side: THREE.DoubleSide,
  })

export const updateBallSaverHologramMaterial = (material: THREE.ShaderMaterial, time: number) => {
  const uTime = material.uniforms.uTime
  if (uTime) uTime.value = time
}

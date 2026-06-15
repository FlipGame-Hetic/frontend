import * as THREE from "three"
import {
  PLUNGER_RING_COLOR_COLD,
  PLUNGER_RING_COLOR_HOT,
  PLUNGER_RING_COLOR_PEAK,
  PLUNGER_VFX_HDR_FACTOR,
} from "./plungerVfxConfig"

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uCharge;
  uniform float uFlash;
  uniform float uPhase;
  uniform float uIntensity;
  uniform float uHdr;
  uniform vec3 uColorCold;
  uniform vec3 uColorHot;
  uniform vec3 uColorPeak;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float bands = sin((vUv.x + uPhase) * 18.8496 - uTime * (2.5 + uCharge * 9.0)) * 0.5 + 0.5;
    bands = pow(bands, 3.0);

    float pulse = 0.85 + 0.15 * sin(uTime * 2.2 + uPhase * 6.2832);

    float NdotV = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.0);

    vec3 col = mix(uColorCold, uColorHot, smoothstep(0.0, 0.7, uCharge));
    col = mix(col, uColorPeak, smoothstep(0.7, 1.0, uCharge));

    float intensity = (0.55 + 0.45 * bands) * pulse * (1.0 + 2.0 * uCharge) + uFlash * 2.5;
    vec3 color = col * intensity * uIntensity * uHdr;

    float alpha = clamp(0.35 + 0.65 * bands + fresnel * 0.25 + uFlash, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

export const createEnergyRingMaterial = (phase: number, intensity = 1): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCharge: { value: 0 },
      uFlash: { value: 0 },
      uPhase: { value: phase },
      uIntensity: { value: intensity },
      uHdr: { value: PLUNGER_VFX_HDR_FACTOR },
      uColorCold: { value: new THREE.Color(PLUNGER_RING_COLOR_COLD) },
      uColorHot: { value: new THREE.Color(PLUNGER_RING_COLOR_HOT) },
      uColorPeak: { value: new THREE.Color(PLUNGER_RING_COLOR_PEAK) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

export const updateEnergyRingMaterial = (
  material: THREE.ShaderMaterial,
  time: number,
  charge: number,
  flash: number,
) => {
  const uniforms = material.uniforms
  if (uniforms.uTime) uniforms.uTime.value = time
  if (uniforms.uCharge) uniforms.uCharge.value = charge
  if (uniforms.uFlash) uniforms.uFlash.value = flash
}

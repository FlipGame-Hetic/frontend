import * as THREE from "three"
import {
  PLUNGER_RING_COLOR_COLD,
  PLUNGER_RING_COLOR_HOT,
  PLUNGER_RING_COLOR_PEAK,
  PLUNGER_VFX_HDR_FACTOR,
} from "./plungerVfxConfig"

// The vertex shader runs once per vertex, it places the ring on screen and hands the fragment shader what it needs for the rim glow
const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    // Normal in view space so the fragment shader can compare it against the camera direction
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    // Direction from this point back toward the camera, used for the fresnel rim
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

// The fragment shader runs once per pixel, it picks the energy color and how bright the pixel glows
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
    // Stripes wrapping around the ring that scroll over time, the 18.8496 is about 6*PI so a few bands fit around it, and they scroll faster the more charged the plunger is
    float bands = sin((vUv.x + uPhase) * 18.8496 - uTime * (2.5 + uCharge * 9.0)) * 0.5 + 0.5;
    // Cubing pushes the soft sine into thin sharp bright lines
    bands = pow(bands, 3.0);

    // Slow brightness breathing so the ring never looks fully static
    float pulse = 0.85 + 0.15 * sin(uTime * 2.2 + uPhase * 6.2832);

    // Fresnel rim, the edges facing away from the camera glow more, classic for an energy look
    float NdotV = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.0);

    // Cold to hot to peak following the charge, same ramp as getChargeColor on the CPU side
    vec3 col = mix(uColorCold, uColorHot, smoothstep(0.0, 0.7, uCharge));
    col = mix(col, uColorPeak, smoothstep(0.7, 1.0, uCharge));

    // Brightness from the bands and pulse, boosted by charge, with the launch flash added on top
    float intensity = (0.55 + 0.45 * bands) * pulse * (1.0 + 2.0 * uCharge) + uFlash * 2.5;
    // Multiply by the HDR factor so values go past 1 and the bloom pass lights them up
    vec3 color = col * intensity * uIntensity * uHdr;

    // Solid where the bands are bright, plus a bit on the rim and the flash, additive blending does the rest
    float alpha = clamp(0.35 + 0.65 * bands + fresnel * 0.25 + uFlash, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

// Builds one ring material, phase shifts its animation, intensity scales its glow, hotColor lets the tip rings use a different mid color
export const createEnergyRingMaterial = (
  phase: number,
  intensity = 1,
  hotColor = PLUNGER_RING_COLOR_HOT,
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCharge: { value: 0 },
      uFlash: { value: 0 },
      uPhase: { value: phase },
      uIntensity: { value: intensity },
      uHdr: { value: PLUNGER_VFX_HDR_FACTOR },
      uColorCold: { value: new THREE.Color(PLUNGER_RING_COLOR_COLD) },
      uColorHot: { value: new THREE.Color(hotColor) },
      uColorPeak: { value: new THREE.Color(PLUNGER_RING_COLOR_PEAK) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    // Additive so overlapping rings build up light, depthWrite off so they do not hide each other
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

// Per-frame update, only the time, charge and flash uniforms change, the colors and phase are set once at creation
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

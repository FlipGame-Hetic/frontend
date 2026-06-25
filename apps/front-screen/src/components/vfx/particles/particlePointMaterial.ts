import { AdditiveBlending, ShaderMaterial } from "three"

const VERTEX_SHADER = /* glsl */ `
attribute vec4 aColor;
attribute float aSize;

varying vec4 vColor;

void main() {
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float perspective = 260.0 / max(1.0, -mvPosition.z);
  gl_PointSize = clamp(aSize * perspective * 18.0, 2.0, 24.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const FRAGMENT_SHADER = /* glsl */ `
varying vec4 vColor;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  float core = 1.0 - smoothstep(0.08, 0.34, dist);
  float halo = 1.0 - smoothstep(0.22, 0.5, dist);
  float intensity = core + halo * 0.35;

  if (intensity <= 0.01 || vColor.a <= 0.001) discard;

  gl_FragColor = vec4(vColor.rgb * intensity, vColor.a * intensity);
}
`

export const createParticlePointMaterial = (): ShaderMaterial =>
  new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: AdditiveBlending,
  })

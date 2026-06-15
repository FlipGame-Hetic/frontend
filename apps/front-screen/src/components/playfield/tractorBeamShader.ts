export const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying float vFresnel;

void main() {
  vUv = uv;

  vec3 worldNormal = normalize(normalMatrix * normal);
  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
  vec3 viewDir = normalize(-viewPos.xyz);
  vFresnel = 1.0 - abs(dot(worldNormal, viewDir));

  gl_Position = projectionMatrix * viewPos;
}
`

export const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;
varying float vFresnel;

const float RING_COUNT = 9.0;
const float RING_SPEED = 0.9;
const float WELL_POWER = 1.8;
const float SWIRL = 2.0;
const float LINE_WIDTH = 0.045;

void main() {
  // vUv.y: 0 = embouchure (base, cote camera), 1 = apex (pointe, dans le plateau)
  float axis = vUv.y;

  // Puits gravitationnel: anneaux resserres vers l'apex
  float well = pow(axis, WELL_POWER);

  // Anneaux aspires vers l'apex + leger vortex pilote par l'angle (vUv.x)
  float phase = well * RING_COUNT + vUv.x * SWIRL - uTime * RING_SPEED;

  // Lignes fines anti-aliasees (largeur stable au pixel via fwidth)
  float fp = fract(phase);
  float dist = min(fp, 1.0 - fp);
  float aa = fwidth(phase);
  float rings = 1.0 - smoothstep(LINE_WIDTH, LINE_WIDTH + aa, dist);

  // Glow de bord (fresnel) discret, concentre sur la silhouette
  float edge = pow(vFresnel, 3.0);

  // Attenuation douce aux extremites du cone
  float ends = smoothstep(0.0, 0.12, axis) * smoothstep(1.0, 0.82, axis);

  float intensity = (rings + edge * 0.35) * ends;
  intensity = clamp(intensity, 0.0, 1.0);

  vec3 color = uColor * (1.0 + rings * 0.6);

  gl_FragColor = vec4(color * intensity, intensity);
}
`

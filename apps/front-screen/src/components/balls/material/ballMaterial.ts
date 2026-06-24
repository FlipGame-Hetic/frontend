import * as THREE from "three"

// Pushes the line color above 1.0 so the bloom pass makes the ball's circuit lines glow
const HDR_FACTOR = 3.5

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
  uniform vec3 lineColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float band(float x, float center, float hw, float aa) {
    float d = abs(x - center);
    float ehw = max(hw, aa);
    return 1.0 - smoothstep(ehw - aa, ehw + aa, d);
  }

  void main() {
    float u = vUv.x;
    float v = vUv.y;

    vec3 base = vec3(0.03, 0.03, 0.06);

    float NdotV = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - NdotV, 4.0);

    float aaV = fwidth(v) * 0.75;
    float aaU = fwidth(u) * 0.75;

    float h1 = band(v, 0.27, 0.012, aaV);
    float h2 = band(v, 0.73, 0.012, aaV);

    float inBand = smoothstep(0.25, 0.27, v) * smoothstep(0.75, 0.73, v);

    float pu = fract(u);
    float conn1 = max(band(pu, 0.0, 0.012, aaU), band(pu, 1.0, 0.012, aaU)) * inBand;
    float conn2 = band(pu, 0.5, 0.012, aaU) * inBand;

    float circuit = clamp(h1 + h2 + conn1 + conn2, 0.0, 1.0);

    vec3 color = base
      + lineColor * circuit
      + lineColor * fresnel * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`

const createUniforms = (color: string) => ({
  lineColor: { value: new THREE.Color(color).multiplyScalar(HDR_FACTOR) },
})

export const createBallMaterial = (color: string): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: createUniforms(color),
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })

export const updateBallMaterialColor = (mat: THREE.ShaderMaterial, color: string) => {
  const uniform = mat.uniforms.lineColor
  if (!uniform) return
  ;(uniform.value as THREE.Color).set(color).multiplyScalar(HDR_FACTOR)
}

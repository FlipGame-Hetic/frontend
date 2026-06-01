import * as THREE from "three"

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

  float band(float x, float center, float hw) {
    return 1.0 - smoothstep(hw - 0.006, hw + 0.006, abs(x - center));
  }

  void main() {
    float u = vUv.x;
    float v = vUv.y;

    vec3 base = vec3(0.03, 0.03, 0.06);

    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, 4.0);

    float h1 = band(v, 0.27, 0.012);
    float h2 = band(v, 0.73, 0.012);

    float inBand = smoothstep(0.25, 0.27, v) * smoothstep(0.75, 0.73, v);

    float pu = fract(u);
    float conn1 = max(band(pu, 0.0, 0.012), band(pu, 1.0, 0.012)) * inBand;
    float conn2 = band(pu, 0.5, 0.012) * inBand;

    float circuit = clamp(h1 + h2 + conn1 + conn2, 0.0, 1.0);

    vec3 color = base
      + lineColor * circuit
      + lineColor * fresnel * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`

interface BallShaderUniforms {
  lineColor: { value: THREE.Color }
}

const createUniforms = (color: string): BallShaderUniforms => ({
  lineColor: { value: new THREE.Color(color).multiplyScalar(HDR_FACTOR) },
})

export const createBallMaterial = (color: string): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: createUniforms(color),
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })

export const updateBallMaterialColor = (mat: THREE.ShaderMaterial, color: string) => {
  const { lineColor } = mat.uniforms as BallShaderUniforms
  lineColor.value.set(color).multiplyScalar(HDR_FACTOR)
}

export const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec3 uTintColor;
varying vec2 vUv;

vec4 permute_3d(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt3d(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float simplexNoise3d(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute_3d(permute_3d(permute_3d(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt3d(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm3d(vec3 x, const in int it) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 32; ++i) {
    if (i < it) {
      v += a * simplexNoise3d(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
  }
  return v;
}

vec3 rotateZ(vec3 v, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
}

float facture(vec3 vector) {
  vec3 n = normalize(vector);
  return max(max(n.x, n.y), n.z);
}

vec3 emission(vec3 color, float strength) {
  return color * strength;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;

  vec3 color = vec3(uv.xy, 0.0);
  color.z += 0.5;
  color = normalize(color);
  color -= 0.2 * vec3(0.0, 0.0, uTime);

  float angle = -log2(max(length(uv), 0.0001));
  color = rotateZ(color, angle);

  float frequency = 1.4;
  float distortion = 0.01;
  color.x = fbm3d(color * frequency + 0.0, 5) + distortion;
  color.y = fbm3d(color * frequency + 1.0, 5) + distortion;
  color.z = fbm3d(color * frequency + 2.0, 5) + distortion;
  vec3 noiseColor = color;

  noiseColor *= 2.0;
  noiseColor -= 0.1;
  noiseColor *= 0.188;
  noiseColor += vec3(uv.xy, 0.0);

  float noiseColorLength = length(noiseColor);
  noiseColorLength = 0.770 - noiseColorLength;
  noiseColorLength *= 4.2;

  vec3 emissionColor = emission(uTintColor, noiseColorLength * 0.4);

  float fac = length(uv) - facture(color + 0.32);
  fac += 0.1;
  fac *= 3.0;

  color = mix(emissionColor, vec3(fac), fac + 1.2);

  color = clamp(color, 0.0, 1.0);
  float r = length(uv);
  float alpha = 1.0 - smoothstep(0.78, 1.0, r);
  float whiteness = min(min(color.r, color.g), color.b);
  float whiteSuppress = smoothstep(0.0, 0.9, r);
  alpha *= (1.0 - whiteness * whiteSuppress);
  gl_FragColor = vec4(color * alpha, alpha);
}
`

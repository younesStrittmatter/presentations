/**
 * Full-screen quad vertex + luminance-aware halftone post fragment.
 * Edit the fragment shader to change the “look” (grain, vignette, etc.).
 * Must match uniform names used in CanvasWebGLSlide.vue when calling `gl.uniform*`.
 */
export const FULLSCREEN_QUAD_ATTR = "a_position";

export function fullscreenQuadVertex(attr = FULLSCREEN_QUAD_ATTR): string {
  return `
attribute vec2 ${attr};
varying vec2 v_uv;
void main() {
  v_uv = ${attr} * 0.5 + 0.5;
  gl_Position = vec4(${attr}, 0.0, 1.0);
}
`;
}

/** Fragment: samples `u_scene`, modulates with halftone-ish screens. Uniforms: u_resolution, u_scale, u_scene */
export const halftonePostFragment = `
precision mediump float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_scale;
uniform sampler2D u_scene;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 sceneColor = texture2D(u_scene, v_uv);
  float L = clamp(luma(sceneColor.rgb), 0.0, 1.0);

  vec2 uv = v_uv * u_resolution / min(u_resolution.x, u_resolution.y);
  float a1 = 0.0;
  float a2 = -0.35;
  float c1 = cos(a1);
  float s1 = sin(a1);
  vec2 uvr1 = vec2(c1 * uv.x - s1 * uv.y, s1 * uv.x + c1 * uv.y);
  float c2 = cos(a2);
  float s2 = sin(a2);
  vec2 uvr2 = vec2(c2 * uv.x - s2 * uv.y, s2 * uv.x + c2 * uv.y);

  vec2 g1 = fract(uvr1 * u_scale) - 0.5;
  float d1 = length(g1);
  float r1 = mix(0.48, 0.12, L);
  float h1 = smoothstep(r1 + 0.05, r1 - 0.05, d1);

  vec2 g2 = fract(uvr2 * u_scale * 1.45) - 0.5;
  float d2 = length(g2);
  float r2 = mix(0.4, 0.1, L);
  float h2 = smoothstep(r2 + 0.042, r2 - 0.042, d2);

  float strength = 0.18;
  float fine = 0.1;
  float ink = mix(1.0 - strength, 1.0, h1) * mix(1.0 - fine, 1.0, h2);
  ink = clamp(ink, 0.88, 1.0);

  gl_FragColor = vec4(sceneColor.rgb * ink, 1.0);
}
`;

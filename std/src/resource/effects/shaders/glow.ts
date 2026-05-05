import { Draw } from '../../../base/draw/shapes.ts';

// Unrolled 5x5 Gaussian-like blur with asymmetric weights.
// 25 explicit texture2D calls avoids loop overhead and allows better
// instruction scheduling by the GPU compiler.
const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_intensity;
  uniform float u_threshold;
  uniform float u_blurSize;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    float contribution = max(0.0, brightness - u_threshold);

    float s = u_blurSize * 0.01;
    vec4 blur = vec4(0.0);

    // Row y=-2: weights 0.2, 0.4, 0.6, 0.4, 0.2
    blur += texture2D(u_image, v_texCoord + vec2(-2.0*s, -2.0*s)) * 0.2;
    blur += texture2D(u_image, v_texCoord + vec2(-1.0*s, -2.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2( 0.0,    -2.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 1.0*s, -2.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2( 2.0*s, -2.0*s)) * 0.2;

    // Row y=-1: weights 0.4, 0.6, 0.8, 0.6, 0.4
    blur += texture2D(u_image, v_texCoord + vec2(-2.0*s, -1.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2(-1.0*s, -1.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 0.0,    -1.0*s)) * 0.8;
    blur += texture2D(u_image, v_texCoord + vec2( 1.0*s, -1.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 2.0*s, -1.0*s)) * 0.4;

    // Row y=0: weights 0.6, 0.8, 1.0, 0.8, 0.6
    blur += texture2D(u_image, v_texCoord + vec2(-2.0*s,  0.0)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2(-1.0*s,  0.0)) * 0.8;
    blur += texture2D(u_image, v_texCoord + vec2( 0.0,     0.0)) * 1.0;
    blur += texture2D(u_image, v_texCoord + vec2( 1.0*s,  0.0)) * 0.8;
    blur += texture2D(u_image, v_texCoord + vec2( 2.0*s,  0.0)) * 0.6;

    // Row y=1: weights 0.4, 0.6, 0.8, 0.6, 0.4
    blur += texture2D(u_image, v_texCoord + vec2(-2.0*s,  1.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2(-1.0*s,  1.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 0.0,     1.0*s)) * 0.8;
    blur += texture2D(u_image, v_texCoord + vec2( 1.0*s,  1.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 2.0*s,  1.0*s)) * 0.4;

    // Row y=2: weights 0.2, 0.4, 0.6, 0.4, 0.2
    blur += texture2D(u_image, v_texCoord + vec2(-2.0*s,  2.0*s)) * 0.2;
    blur += texture2D(u_image, v_texCoord + vec2(-1.0*s,  2.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2( 0.0,     2.0*s)) * 0.6;
    blur += texture2D(u_image, v_texCoord + vec2( 1.0*s,  2.0*s)) * 0.4;
    blur += texture2D(u_image, v_texCoord + vec2( 2.0*s,  2.0*s)) * 0.2;

    blur /= 13.0;

    float blurBrightness = dot(blur.rgb, vec3(0.2126, 0.7152, 0.0722));
    float glowAmount = max(0.0, blurBrightness - u_threshold) * contribution * u_intensity;

    gl_FragColor = vec4(color.rgb + blur.rgb * glowAmount, color.a);
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface GlowShader {
  readonly shader: Shader;
  setIntensity(intensity: number): void;
  setThreshold(threshold: number): void;
  setBlurSize(blurSize: number): void;
  setAll(intensity: number, threshold: number, blurSize: number): void;
}

export function createGlowEffect(
  intensity: number = 1.5,
  threshold: number = 0.8,
  blurSize: number = 4.0,
): GlowShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_intensity: { type: 'float', value: intensity },
      u_threshold: { type: 'float', value: threshold },
      u_blurSize: { type: 'float', value: blurSize },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setIntensity(v: number) {
      Draw.setShaderUniforms(shader, { u_intensity: { type: 'float', value: v } });
    },
    setThreshold(v: number) {
      Draw.setShaderUniforms(shader, { u_threshold: { type: 'float', value: v } });
    },
    setBlurSize(v: number) {
      Draw.setShaderUniforms(shader, { u_blurSize: { type: 'float', value: v } });
    },
    setAll(i: number, t: number, b: number) {
      Draw.setShaderUniforms(shader, {
        u_intensity: { type: 'float', value: i },
        u_threshold: { type: 'float', value: t },
        u_blurSize: { type: 'float', value: b },
      });
    },
  };
}
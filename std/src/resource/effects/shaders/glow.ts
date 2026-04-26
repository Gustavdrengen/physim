import { Draw } from '../../../base/draw/shapes.ts';

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

    vec4 blur = vec4(0.0);
    float total = 0.0;
    for (float x = -2.0; x <= 2.0; x += 1.0) {
      for (float y = -2.0; y <= 2.0; y += 1.0) {
        vec2 offset = vec2(x, y) * u_blurSize * 0.01;
        vec4 sample = texture2D(u_image, v_texCoord + offset);
        float w = 1.0 - abs(x) * 0.2 - abs(y) * 0.2;
        blur += sample * w;
        total += w;
      }
    }
    blur /= total;

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
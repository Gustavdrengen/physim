import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // Brightness
    vec3 rgb = color.rgb * u_brightness;

    // Contrast
    rgb = (rgb - 0.5) * u_contrast + 0.5;

    // Saturation
    float gray = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    rgb = mix(vec3(gray), rgb, u_saturation);

    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface ColorGradingShader {
  readonly shader: Shader;
  setBrightness(brightness: number): void;
  setContrast(contrast: number): void;
  setSaturation(saturation: number): void;
  setAll(brightness: number, contrast: number, saturation: number): void;
}

export function createColorGradingEffect(
  brightness: number = 1.0,
  contrast: number = 1.0,
  saturation: number = 1.0,
): ColorGradingShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_brightness: { type: 'float', value: brightness },
      u_contrast: { type: 'float', value: contrast },
      u_saturation: { type: 'float', value: saturation },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setBrightness(v: number) {
      Draw.setShaderUniforms(shader, { u_brightness: { type: 'float', value: v } });
    },
    setContrast(v: number) {
      Draw.setShaderUniforms(shader, { u_contrast: { type: 'float', value: v } });
    },
    setSaturation(v: number) {
      Draw.setShaderUniforms(shader, { u_saturation: { type: 'float', value: v } });
    },
    setAll(b: number, c: number, s: number) {
      Draw.setShaderUniforms(shader, {
        u_brightness: { type: 'float', value: b },
        u_contrast: { type: 'float', value: c },
        u_saturation: { type: 'float', value: s },
      });
    },
  };
}
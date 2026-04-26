import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = vec4(0.0);
    float total = 0.0;

    for (float x = -2.0; x <= 2.0; x += 1.0) {
      for (float y = -2.0; y <= 2.0; y += 1.0) {
        vec2 offset = vec2(x, y) * u_amount * 0.01;
        float weight = 1.0 - length(vec2(x, y)) * 0.15;
        weight = max(weight, 0.0);
        color += texture2D(u_image, v_texCoord + offset) * weight;
        total += weight;
      }
    }

    gl_FragColor = color / total;
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface BlurShader {
  readonly shader: Shader;
  setAmount(amount: number): void;
}

export function createBlurEffect(amount: number = 2.0): BlurShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_amount: { type: 'float', value: amount },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setAmount(v: number) {
      Draw.setShaderUniforms(shader, { u_amount: { type: 'float', value: v } });
    },
  };
}
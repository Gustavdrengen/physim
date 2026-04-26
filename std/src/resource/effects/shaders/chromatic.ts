import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  varying vec2 v_texCoord;

  void main() {
    vec2 center = vec2(0.5);
    vec2 dir = v_texCoord - center;
    float dist = length(dir);

    vec2 redOffset = dir * u_amount * 0.01;
    vec2 greenOffset = dir * u_amount * 0.005;
    vec2 blueOffset = -dir * u_amount * 0.005;

    float r = texture2D(u_image, v_texCoord + redOffset).r;
    float g = texture2D(u_image, v_texCoord + greenOffset).g;
    float b = texture2D(u_image, v_texCoord + blueOffset).b;
    float a = texture2D(u_image, v_texCoord).a;

    float aberration = dist * u_amount * 0.02;
    r = texture2D(u_image, v_texCoord + redOffset * (1.0 + aberration)).r;
    b = texture2D(u_image, v_texCoord + blueOffset * (1.0 + aberration)).b;

    gl_FragColor = vec4(r, g, b, a);
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface ChromaticAberrationShader {
  readonly shader: Shader;
  setAmount(amount: number): void;
}

export function createChromaticAberrationEffect(amount: number = 1.0): ChromaticAberrationShader {
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
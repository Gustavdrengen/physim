import { Draw } from '../../../base/draw/shapes.ts';

const _horizontalFragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  varying vec2 v_texCoord;

  void main() {
    vec2 step = vec2(u_amount * 0.01, 0.0);
    vec4 color = vec4(0.0);

    color += texture2D(u_image, v_texCoord) * 1.0;
    color += texture2D(u_image, v_texCoord + step) * 0.85;
    color += texture2D(u_image, v_texCoord - step) * 0.85;
    color += texture2D(u_image, v_texCoord + step * 2.0) * 0.7;
    color += texture2D(u_image, v_texCoord - step * 2.0) * 0.7;

    gl_FragColor = color / 4.1;
  }
`;

const _verticalFragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_amount;
  varying vec2 v_texCoord;

  void main() {
    vec2 step = vec2(0.0, u_amount * 0.01);
    vec4 color = vec4(0.0);

    color += texture2D(u_image, v_texCoord) * 1.0;
    color += texture2D(u_image, v_texCoord + step) * 0.85;
    color += texture2D(u_image, v_texCoord - step) * 0.85;
    color += texture2D(u_image, v_texCoord + step * 2.0) * 0.7;
    color += texture2D(u_image, v_texCoord - step * 2.0) * 0.7;

    gl_FragColor = color / 4.1;
  }
`;

const _horizontalProgram = Draw.createShaderProgram(_horizontalFragment);
const _verticalProgram = Draw.createShaderProgram(_verticalFragment);

export interface BlurShader {
  readonly shaders: readonly [Shader, Shader];
  setAmount(amount: number): void;
}

export function createBlurEffect(amount: number = 2.0): BlurShader {
  const horizShader = Draw.createShader(_horizontalProgram, {
    uniforms: {
      u_amount: { type: 'float', value: amount },
    },
  });

  const vertShader = Draw.createShader(_verticalProgram, {
    uniforms: {
      u_amount: { type: 'float', value: amount },
    },
  });

  return {
    get shaders() {
      return [horizShader, vertShader] as const;
    },
    setAmount(v: number) {
      Draw.setShaderUniforms(horizShader, { u_amount: { type: 'float', value: v } });
      Draw.setShaderUniforms(vertShader, { u_amount: { type: 'float', value: v } });
    },
  };
}

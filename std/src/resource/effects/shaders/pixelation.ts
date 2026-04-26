import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_pixelSize;
  varying vec2 v_texCoord;

  void main() {
    vec2 pixelSize = vec2(u_pixelSize);
    vec2 uv = floor(v_texCoord / pixelSize) * pixelSize;
    gl_FragColor = texture2D(u_image, uv);
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface PixelationShader {
  readonly shader: Shader;
  setPixelSize(pixelSize: number): void;
}

export function createPixelationEffect(pixelSize: number = 8.0): PixelationShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_pixelSize: { type: 'float', value: pixelSize },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setPixelSize(v: number) {
      Draw.setShaderUniforms(shader, { u_pixelSize: { type: 'float', value: v } });
    },
  };
}
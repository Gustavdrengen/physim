import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(1.0 - color.rgb, color.a);
  }
`;

const _program = Draw.createShaderProgram(_fragment);
export const invertEffect = Draw.createShader(_program);
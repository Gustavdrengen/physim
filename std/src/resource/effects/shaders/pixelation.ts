import { Draw } from "../../../base/draw/shapes.ts";

const _fragment = `

precision mediump float;

uniform sampler2D u_image;
uniform float u_pixelSize;      // e.g. 8.0 screen/texture pixels
uniform vec2 u_resolution;      // texture size, e.g. (512,512)

varying vec2 v_texCoord;

void main() {
    vec2 texelCoord = v_texCoord * u_resolution;

    texelCoord = floor(texelCoord / u_pixelSize) * u_pixelSize;

    vec2 uv = texelCoord / u_resolution;

    gl_FragColor = texture2D(u_image, uv);
}
`;

const _program = Draw.createShaderProgram(_fragment);

export interface PixelationShader {
  readonly shader: Shader;
  setPixelSize(pixelSize: number): void;
}

export function createPixelationEffect(
  pixelSize: number = 8.0,
  resolution: [number, number] = [1920, 1080],
): PixelationShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_pixelSize: { type: "float", value: pixelSize },
      u_resolution: {
        type: "vec2",
        value: resolution,
      },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setPixelSize(v: number) {
      Draw.setShaderUniforms(shader, {
        u_pixelSize: { type: "float", value: v },
      });
    },
  };
}

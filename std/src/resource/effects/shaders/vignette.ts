import { Draw } from '../../../base/draw/shapes.ts';

const _fragment = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_radius;
  uniform float u_softness;
  varying vec2 v_texCoord;
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float dist = distance(v_texCoord, vec2(0.5));
    float vignette = 1.0 - smoothstep(u_radius - u_softness, u_radius, dist);
    gl_FragColor = vec4(color.rgb * vignette, color.a);
  }
`;

const _program = Draw.createShaderProgram(_fragment);

export interface VignetteShader {
  readonly shader: Shader;
  setRadius(radius: number): void;
  setSoftness(softness: number): void;
  setRadiusAndSoftness(radius: number, softness: number): void;
}

export function createVignetteEffect(
  radius: number = 0.5,
  softness: number = 0.5,
): VignetteShader {
  const shader = Draw.createShader(_program, {
    uniforms: {
      u_radius: { type: 'float', value: radius },
      u_softness: { type: 'float', value: softness },
    },
  });

  return {
    get shader() {
      return shader;
    },
    setRadius(r: number) {
      Draw.setShaderUniforms(shader, { u_radius: { type: 'float', value: r } });
    },
    setSoftness(s: number) {
      Draw.setShaderUniforms(shader, { u_softness: { type: 'float', value: s } });
    },
    setRadiusAndSoftness(r: number, s: number) {
      Draw.setShaderUniforms(shader, {
        u_radius: { type: 'float', value: r },
        u_softness: { type: 'float', value: s },
      });
    },
  };
}
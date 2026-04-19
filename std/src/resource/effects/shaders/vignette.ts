/**
 * Creates a vignette post-processing shader.
 *
 * @param radius The radius of the vignette. Defaults to 0.5.
 * @param softness The softness of the vignette edges. Defaults to 0.5.
 * @returns The created shader.
 */
export function createVignetteEffect(radius: number = 0.5, softness: number = 0.5): Shader {
  return sim.createShader({
    name: "vignette",
    fragment: `
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
    `,
    uniforms: {
      u_radius: { type: "float", value: radius },
      u_softness: { type: "float", value: softness },
    },
  });
}

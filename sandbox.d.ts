import type { SoundProps } from "./sound.ts";

/**
 * Represents a compiled WebGL shader.
 */
export type Shader = number & { readonly __brand: unique symbol };

declare global {
  type Shader = number & { readonly __brand: unique symbol };

  const sim: {
    log: (...args: any[]) => void;
    finish: () => void;
    ctx: CanvasRenderingContext2D;
    resizeCanvas: (width: number, height: number) => void;
    addSound: (props: SoundProps) => Promise<number>;
    playSound: (sound: number) => void;
    run: (onUpdate: () => void) => Promise<void>;
    addFetchAsset: (path: string, fetchAddr: string) => Promise<void>;
    __PROFILE_ENTER: (name: string) => void;
    __PROFILE_EXIT: () => void;

    createShader: (descriptor: ShaderDescriptor) => Shader;
    applyShader: (shader: Shader, uniforms?: Record<string, any>) => void;
    clear: (color: string) => void;
  };
}

export type UniformType =
  | "float"
  | "vec2"
  | "vec3"
  | "vec4"
  | "int"
  | "bool"
  | "sampler2D";

export interface UniformDefinition {
  type: UniformType;
  value: any;
}

export type BlendMode = "alpha" | "add" | "multiply" | "screen";

export interface ShaderDescriptor {
  name: string;
  vertex?: string;
  fragment: string;
  uniforms?: Record<string, UniformDefinition>;
  passes?: number;
  blend?: BlendMode;
}

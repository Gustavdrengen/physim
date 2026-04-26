import type { SoundProps } from './sound.ts';

/**
 * Represents a compiled WebGL shader program.
 */
export type ShaderProgram = number & { readonly __brand: unique symbol };

/**
 * Represents a shader instance with uniforms and blend mode configured.
 */
export type Shader = number & { readonly __brand: unique symbol };

declare global {
  type ShaderProgram = number & { readonly __brand: unique symbol };
  type Shader = number & { readonly __brand: unique symbol };

  type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'bool' | 'sampler2D';

  interface UniformDefinition {
    type: UniformType;
    value: unknown;
  }

  type BlendMode = 'alpha' | 'add' | 'multiply' | 'screen';

  interface ShaderConfig {
    uniforms?: Record<string, UniformDefinition>;
    blend?: BlendMode;
  }

  const sim: {
    log: (...args: any[]) => void;
    finish: () => void;
    ctx: CanvasRenderingContext2D;
    document: Document;
    resizeCanvas: (width: number, height: number) => void;
    addSound: (props: SoundProps) => Promise<number>;
    playSound: (sound: number) => void;
    run: (onUpdate: () => void) => Promise<void>;
    addFetchAsset: (path: string, fetchAddr: string) => Promise<void>;
    __PROFILE_ENTER: (name: string) => void;
    __PROFILE_EXIT: () => void;

    createShaderProgram: (fragment: string, vertex?: string) => ShaderProgram;
    createShader: (program: ShaderProgram, config?: ShaderConfig) => Shader;
    setShaderUniforms: (shader: Shader, uniforms: Record<string, UniformDefinition>) => void;
    applyShader: (shader: Shader) => void;
    clear: (color: string) => void;
  };
}

export type UniformType =
  | 'float'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'int'
  | 'bool'
  | 'sampler2D';

export interface UniformDefinition {
  type: UniformType;
  value: unknown;
}

export type BlendMode = 'alpha' | 'add' | 'multiply' | 'screen';

export interface ShaderConfig {
  uniforms?: Record<string, UniformDefinition>;
  blend?: BlendMode;
}
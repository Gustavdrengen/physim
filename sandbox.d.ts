import type { SoundProps } from "./sound.ts";

declare global {
  const sim: {
    log: (...args: any[]) => void;
    finish: () => void;
    ctx: CanvasRenderingContext2D;
    resizeCanvas: (width: number, height: number) => void;
    addSound: (props: SoundProps) => Promise<number>;
    playSound: (sound: number) => void;
    onUpdate: (() => void) | undefined;
    addFetchAsset: (path: string, fetchAddr: string) => Promise<void>;
  };
}

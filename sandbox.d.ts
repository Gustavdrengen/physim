import type { SoundProps } from "./sound.ts";

declare global {
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
  };
}

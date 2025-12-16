declare const sim: {
  log: (...args: any[]) => void;
  finish: () => void;
  ctx: CanvasRenderingContext2D;
  frame: number;
  resizeCanvas: (width: number, height: number) => void;
  addSound: (props: { src: string }) => Promise<number>;
  playSound: (sound: number) => void;
  onUpdate: (() => void) | undefined;
  addFetchAsset: (path: string, fetchAddr: string) => Promise<void>;
};

declare const sim: {
  log: (...args: any[]) => void;
  finish: () => void;
  ctx: CanvasRenderingContext2D;
  frame: number;
  resizeCanvas: (width: number, height: number) => void;
  onUpdate: (() => void) | undefined;
};

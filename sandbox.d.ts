declare const sim: {
  log: (...args: any[]) => void;
  ctx: CanvasRenderingContext2D;
  resizeCanvas: (width: number, height: number) => void;
  onUpdate: (() => void) | undefined;
};

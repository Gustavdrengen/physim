import {
  getProgramLocations,
  gl,
  hiddenCanvas,
  hiddenCtx,
  is2DMode,
  readTexture,
  copyProgram,
  quadBuffer,
  showCanvas2D,
} from './webgl.ts';
import {
  frameState,
  flushComplete,
  getClearColor,
  markNeedsFlush,
  isShaderModeActive,
} from './state.ts';

export function flushFrame(): void {
  // Fast path: no shaders have ever been used — skip WebGL entirely.
  // Just show the 2D canvas directly.
  if (!isShaderModeActive()) {
    // Ensure 2D canvas is visible (first frame after init)
    if (!is2DMode()) {
      showCanvas2D();
    }

    // If no shader ran, we still need to handle the texImage2D path
    // — but in 2D mode we don't need it. Just clear and move on.
    if (frameState.needsFlush && !frameState.anyShaderRun) {
      // Just show the 2D canvas. No WebGL upload needed since we're
      // rendering to the hidden canvas directly which is now visible.
    }
  } else {
    // WebGL mode: shaders are active
    if (frameState.needsFlush && !frameState.anyShaderRun) {
      gl.bindTexture(gl.TEXTURE_2D, readTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        hiddenCanvas,
      );
    }
  }

  // In 2D mode, the clear happens at frame start (in resetFrameState)
  // to avoid a blank frame between JS yielding and browser rendering.
  if (isShaderModeActive()) {
    hiddenCtx.clearRect(
      0,
      0,
      hiddenCanvas.width,
      hiddenCanvas.height,
    );
  }

  flushComplete();

  // Skip WebGL rendering entirely when no shaders active
  if (!isShaderModeActive()) {
    markNeedsFlush();
    return;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.viewport(
    0,
    0,
    gl.canvas.width,
    gl.canvas.height,
  );

  gl.useProgram(copyProgram);

  gl.activeTexture(gl.TEXTURE0);

  gl.bindTexture(gl.TEXTURE_2D, readTexture);

  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

  // Use cached locations instead of querying every frame
  const locs = getProgramLocations(copyProgram);

  if (locs.position !== -1) {
    gl.enableVertexAttribArray(locs.position);
    gl.vertexAttribPointer(locs.position, 2, gl.FLOAT, false, 16, 0);
  }

  if (locs.texCoord !== -1) {
    gl.enableVertexAttribArray(locs.texCoord);
    gl.vertexAttribPointer(locs.texCoord, 2, gl.FLOAT, false, 16, 8);
  }

  if (locs.uImage !== null) {
    gl.uniform1i(locs.uImage, 0);
  }

  gl.disable(gl.BLEND);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  markNeedsFlush();
}

export function resetFrameState(): void {
  markNeedsFlush();
  frameState.firstShaderInFrame = true;
  frameState.anyShaderRun = false;

  // In 2D mode, fill the visible canvas with the stored clear color
  // at the start of the frame so the background is correct.
  if (!isShaderModeActive()) {
    const c = getClearColor();
    hiddenCtx.fillStyle = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
    hiddenCtx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
  }
}

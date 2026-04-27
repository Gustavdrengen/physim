import {
  gl,
  hiddenCanvas,
  hiddenCtx,
  readTexture,
  copyProgram,
  quadBuffer,
} from './webgl.ts';
import {
  frameState,
  flushComplete,
  markNeedsFlush,
} from './state.ts';

export function flushFrame(): void {
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

  hiddenCtx.clearRect(
    0,
    0,
    hiddenCanvas.width,
    hiddenCanvas.height,
  );

  flushComplete();

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

  const positionLoc = gl.getAttribLocation(copyProgram, 'position');
  const texCoordLoc = gl.getAttribLocation(copyProgram, 'texCoord');

  if (positionLoc !== -1) {
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
  }

  if (texCoordLoc !== -1) {
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
  }

  const uImageLoc = gl.getUniformLocation(copyProgram, 'u_image');
  if (uImageLoc !== null) {
    gl.uniform1i(uImageLoc, 0);
  }

  gl.disable(gl.BLEND);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  markNeedsFlush();
}

export function resetFrameState(): void {
  markNeedsFlush();
  frameState.firstShaderInFrame = true;
  frameState.anyShaderRun = false;
}
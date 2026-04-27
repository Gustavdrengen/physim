interface OverlayOptions {
  id: string;
  title: string;
  message?: string;
  color: string;
  centered?: boolean;
}

function showOverlay(options: OverlayOptions): void {
  const existing = document.getElementById(options.id);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = options.id;
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    background: options.color,
    color: 'white',
    zIndex: '5',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  });

  if (options.centered) {
    Object.assign(overlay.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
    });
    const text = document.createElement('div');
    text.textContent = options.title;
    overlay.appendChild(text);
  } else {
    Object.assign(overlay.style, {
      padding: '20px',
      overflow: 'auto',
    });

    const container = document.createElement('div');
    Object.assign(container.style, {
      maxWidth: '900px',
      margin: '40px auto',
    });

    const titleEl = document.createElement('h1');
    titleEl.textContent = options.title;
    titleEl.style.marginTop = '0';
    container.appendChild(titleEl);

    if (options.message) {
      const messageEl = document.createElement('pre');
      messageEl.textContent = options.message;
      container.appendChild(messageEl);
    }

    overlay.appendChild(container);
  }

  document.body.appendChild(overlay);
}

export function showFinishOverlay(): void {
  showOverlay({
    id: 'finish-overlay',
    title: 'Finished',
    color: 'rgba(0, 180, 0, 0.85)',
    centered: true,
  });
}

export function showErrorOverlay(err: unknown): void {
  if (!err) return;
  const message = err instanceof Error
    ? `${err.message || String(err)}\n\n${err.stack || '(no stack trace available)'}`
    : String(err);
  showOverlay({
    id: 'error-overlay',
    title: 'Error',
    message,
    color: 'rgba(255, 0, 0, 0.85)',
    centered: false,
  });
}

export function showStoppedOverlay(): void {
  showOverlay({
    id: 'stopped-overlay',
    title: 'Stopped',
    color: 'rgba(255, 180, 0, 0.85)',
    centered: true,
  });
}
interface RunInFrameOptions {
  endowments?: Record<string, unknown>;
  onError?: (err: unknown) => void;
}

interface RunInFrameResult {
  iframe: HTMLIFrameElement;
  window: Window;
  document: Document;
  module: Record<string, unknown>;
}

export function runInFrame(
  code: string,
  options: RunInFrameOptions = {},
): Promise<RunInFrameResult> {
  const { endowments = {}, onError } = options;

  return new Promise((outerResolve, outerReject) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.srcdoc = "<!doctype html><html><head></head><body></body></html>";

    let userBlobUrl: string | undefined;
    let wrapperBlobUrl: string | undefined;
    let settled = false;

    const settleOnce = (fn: (val: unknown) => void) => (val: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(val);
    };

    const resolveOnce = settleOnce(outerResolve);
    const rejectOnce = settleOnce((reason) =>
      outerReject(reason instanceof Error ? reason : new Error(String(reason))),
    );

    const callOnError = (err: unknown) => {
      if (typeof onError === "function") {
        try {
          onError(err);
        } catch {
          //
        }
      }
    };

    const errorHandler = (ev: Event) => {
      const err =
        (ev as ErrorEvent)?.error ||
        (ev as ErrorEvent)?.reason ||
        (ev as MessageEvent)?.data ||
        ev;
      callOnError(err);
      rejectOnce(err || new Error("Unhandled error in iframe"));
    };

    const rejectionHandler = (ev: PromiseRejectionEvent) => {
      const err = ev?.reason || ev;
      callOnError(err);
      rejectOnce(err || new Error("Unhandled rejection in iframe"));
    };

    const scriptErrorHandler = (ev: Event) => {
      const err =
        (ev as ErrorEvent)?.error ||
        ev ||
        new Error("Script failed to load/run");
      callOnError(err);
      rejectOnce(err);
    };

    const cleanup = () => {
      if (userBlobUrl) {
        try {
          URL.revokeObjectURL(userBlobUrl);
        } catch {
          //
        }
      }
      if (wrapperBlobUrl) {
        try {
          URL.revokeObjectURL(wrapperBlobUrl);
        } catch {
          //
        }
      }

      const win = iframe.contentWindow;
      if (win) {
        try {
          win.removeEventListener("error", errorHandler);
          win.removeEventListener("unhandledrejection", rejectionHandler);
          delete win.__runInFrameDone;
          delete win.__runInFrameDoneResolve;
          delete win.__runInFrameDoneReject;
        } catch {
          //
        }
      }

      try {
        iframe.removeEventListener("load", onLoad);
      } catch {
        //
      }
    };

    const onLoad = () => {
      try {
        const win = iframe.contentWindow!;
        const doc = iframe.contentDocument!;

        win.addEventListener("error", errorHandler);
        win.addEventListener("unhandledrejection", rejectionHandler);

        for (const [key, value] of Object.entries(endowments)) {
          try {
            (win as Record<string, unknown>)[key] = value;
          } catch {
            //
          }
        }

        let resolveInner: (val: unknown) => void;
        let rejectInner: (err: unknown) => void;
        const donePromise = new Promise<unknown>((res, rej) => {
          resolveInner = res;
          rejectInner = rej;
        });

        win.__runInFrameDone = donePromise;
        win.__runInFrameDoneResolve = resolveInner;
        win.__runInFrameDoneReject = rejectInner;

        userBlobUrl = URL.createObjectURL(
          new Blob([code], { type: "text/javascript" }),
        );

        const wrapperCode = `
          (async () => {
            try {
              const ns = await import(${JSON.stringify(userBlobUrl)});
              window?.__runInFrameDoneResolve?.(ns);
              return ns;
            } catch (err) {
              window?.__runInFrameDoneReject?.(err);
              throw err;
            }
          })();
        `;

        wrapperBlobUrl = URL.createObjectURL(
          new Blob([wrapperCode], { type: "text/javascript" }),
        );

        const script = doc.createElement("script");
        script.type = "module";
        script.src = wrapperBlobUrl;
        script.onerror = scriptErrorHandler;

        doc.body.appendChild(script);

        donePromise
          .then((moduleNamespace) => {
            resolveOnce({
              iframe,
              window: win,
              document: doc,
              module: moduleNamespace as Record<string, unknown>,
            });
          })
          .catch((err) => {
            callOnError(err);
            rejectOnce(err);
          });
      } catch (err) {
        callOnError(err);
        rejectOnce(err);
      }
    };

    iframe.addEventListener("load", onLoad);
    document.body.appendChild(iframe);
  });
}

declare global {
  interface Window {
    __runInFrameDone?: Promise<unknown>;
    __runInFrameDoneResolve?: (val: unknown) => void;
    __runInFrameDoneReject?: (err: unknown) => void;
  }
}

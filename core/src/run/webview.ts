import { Webview } from "@webview/webview";

export function openWebview(url: string): Worker {
  const workerUrl = new URL("./webview_worker.ts", import.meta.url).href;
  const worker = new Worker(workerUrl, { type: "module" });
  worker.postMessage({ url });
  return worker;
}
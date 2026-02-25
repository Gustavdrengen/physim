export type WebviewMessage = {
    url: string;
};

self.onmessage = async (e: MessageEvent<WebviewMessage>) => {
    try {
        const { url } = e.data;
        const { Webview } = await import("@webview/webview");

        const webview = new Webview();
        webview.navigate(url);
        webview.run();
    } catch (err) {
        console.error("Worker Error executing Webview:", err);
    }
};

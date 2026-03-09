import { Webview } from "@webview/webview";

const url = Deno.args[0];
if (!url) {
  console.error("No URL provided to webview subprocess");
  Deno.exit(1);
}

const webview = new Webview();
webview.navigate(url);
webview.run();

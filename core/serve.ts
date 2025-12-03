import { dirname, fromFileUrl, join } from "@std/path";

const PORT = 8080;

const scriptDir = dirname(fromFileUrl(import.meta.url));
const htmlPath = join(scriptDir, "sim.html");

export function startServer(bundle: string) {
  Deno.serve({ hostname: "127.0.0.1", port: PORT }, async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(await Deno.readFile(htmlPath), {
        headers: { "Content-Type": "text/html" },
      });
    } else if (url.pathname === "/bundle.js") {
      return new Response(await Deno.readFile(bundle), {
        headers: { "Content-Type": "text/javascript" },
      });
    } else if (url.pathname === "/out.js.map") {
      return new Response(await Deno.readFile(bundle + ".map"), {
        headers: { "Content-Type": "text/javascript" },
      });
    } else {
      return new Response("Not Found", { status: 404 });
    }
  });
}

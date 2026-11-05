import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import httpServer from "http-server";

const root = new URL("../", import.meta.url);
const { rewrites } = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
const routes = new Map(rewrites.map(({ source, destination }) => [source, destination]));
const address = "http://127.0.0.1:4173";

const server = httpServer.createServer({
  root: fileURLToPath(root),
  ext: "html",
  cache: -1,
  before: [
    (request, response) => {
      const url = new URL(request.url, address);
      const destination = routes.get(url.pathname.replace(/\/+$/, "") || "/");

      if (destination) request.url = `${destination}.html${url.search}`;
      response.emit("next");
    },
  ],
});

server.listen(4173, "127.0.0.1", () => console.log(`Available on: ${address}`));

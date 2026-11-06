import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import httpServer from "http-server";

const root = new URL("../", import.meta.url);
const { rewrites } = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
const routes = new Map(rewrites.map(({ source, destination }) => [source, destination]));
// Hỗ trợ các route chi tiết một segment như Vercel, không rewrite asset.
const slugRoutes = rewrites
  .filter(({ source }) => source.endsWith("/:slug"))
  .map(({ source, destination }) => ({ prefix: source.slice(0, -5), destination }));
const address = "http://127.0.0.1:4173";

const server = httpServer.createServer({
  root: fileURLToPath(root),
  ext: "html",
  cache: -1,
  before: [
    (request, response) => {
      const url = new URL(request.url, address);
      const path = url.pathname.replace(/\/+$/, "") || "/";
      const destination = routes.get(path) ?? slugRoutes.find(({ prefix }) => {
        const slug = path.slice(prefix.length);
        return path.startsWith(prefix) && slug.length > 0 && !slug.includes("/");
      })?.destination;

      if (destination) request.url = `${destination}.html${url.search}`;
      response.emit("next");
    },
  ],
});

server.listen(4173, "127.0.0.1", () => console.log(`Available on: ${address}`));

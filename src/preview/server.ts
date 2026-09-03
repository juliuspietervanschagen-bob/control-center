import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

export function startPreviewServer(port = config.previewPort): http.Server {
  const root = config.testEmailsDir;

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const filePath = path.normalize(path.join(root, relative));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(error.code === "ENOENT" ? 404 : 500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        res.end(error.code === "ENOENT" ? "Not found. Run npm run dry-run first." : "Server error");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
      res.end(data);
    });
  });

  server.listen(port, "0.0.0.0");
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.log(`Preview already running on http://127.0.0.1:${port}`);
      return;
    }
    throw error;
  });
  return server;
}

if (require.main === module) {
  startPreviewServer();
  console.log(`Preview server: http://127.0.0.1:${config.previewPort}`);
}

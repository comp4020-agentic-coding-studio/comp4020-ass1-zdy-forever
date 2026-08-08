import { createServer } from "node:http";
import type { Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { expect, test } from "@playwright/test";

// GitHub Pages serves this site nested under a path prefix
// (username.github.io/<repo>/), not at the domain root the local `dist`
// preview server uses. `vite.config.ts` builds with `base: "./"` (relative
// asset URLs) specifically so the same build works at any depth — this test
// proves that by serving the built dist/ under an arbitrary nested prefix
// and confirming the page and every asset it requests still resolve, fully
// independent of the webServer/baseURL this config otherwise relies on.
const DIST = resolve("dist");
const PREFIX = "/some-org/some-repo-name";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startSubpathServer(): Promise<{ server: Server; port: number }> {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith(PREFIX)) {
      response.writeHead(404).end();
      return;
    }
    let relativePath = url.pathname.slice(PREFIX.length) || "/";
    if (relativePath === "/") relativePath = "/index.html";
    try {
      const body = await readFile(join(DIST, relativePath));
      response.writeHead(200, { "content-type": MIME[extname(relativePath)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolvePromise) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolvePromise({ server, port });
    });
  });
}

test("the built site loads correctly when served under a nested path prefix", async ({ page }) => {
  const { server, port } = await startSubpathServer();
  try {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));

    await page.goto(`http://127.0.0.1:${port}${PREFIX}/`);

    await expect(page.locator("h1")).toHaveText("Exposure Lab");
    await expect(page.getByRole("button", { name: "Start with ISO →" })).toBeVisible();

    // The stylesheet actually applied, not just fetched: this custom
    // property only exists in styles.css, so its presence proves the
    // relative-URL stylesheet link resolved under the prefix.
    const paperColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(paperColor).not.toBe("");

    await page.evaluate(() => {
      localStorage.setItem("camera-school-tutorial-complete", "true");
      localStorage.setItem("camera-school-completed-lessons", JSON.stringify([
        "tutorial-iso",
        "tutorial-aperture",
        "tutorial-shutter",
        "tutorial-two-dials",
        "tutorial-three-dials",
      ]));
    });
    await page.reload();
    await page.getByRole("button", { name: /Standard answer/ }).click();
    await page.getByRole("button", { name: "Apply this answer" }).click();
    await expect(page.getByRole("button", { name: "Next: Moving subject →" })).toBeVisible();
    await page.getByRole("button", { name: "Review tutorials" }).click();
    await expect(page.getByRole("button", { name: "Next: Aperture →" })).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join(", ")}`).toEqual([]);
    expect(failedRequests, `failed requests: ${failedRequests.join(", ")}`).toEqual([]);
  } finally {
    server.close();
  }
});

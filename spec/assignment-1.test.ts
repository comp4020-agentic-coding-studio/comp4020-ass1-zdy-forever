import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Assignment 1 ("Build an interactive explainer of something you think more
// people should know or understand"). These assert the mechanically-checkable
// lines of the published spec — static/no-backend, and that the page gives the
// visitor something to interact with. "One strong idea... and nothing else",
// "works at both marking viewports", and the process-evidence line are for the
// crit / check:evidence, not this file.
const DIST = resolve("dist");

function htmlFiles(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

const pages = htmlFiles().map((path) => new JSDOM(readFileSync(path, "utf8")).window.document);

describe("assignment 1: static, no backend", () => {
  it("declares no backend/server framework as a dependency", () => {
    const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const BACKEND_MARKERS = ["express", "fastify", "koa", "next", "nuxt", "@remix-run/node"];
    const found = BACKEND_MARKERS.filter((name) => name in deps);
    expect(found, `backend-shaped dependency present: ${found.join(", ")}`).toEqual([]);
  });

  it("ships no server-side source files", () => {
    const SERVER_EXTENSIONS = [".php", ".py", ".rb"];
    const offenders = (readdirSync(DIST, { withFileTypes: true, recursive: true } as any) as any[])
      .filter((entry) => !entry.isDirectory())
      .map((entry) => entry.name as string)
      .filter((name) => SERVER_EXTENSIONS.some((ext) => name.endsWith(ext)));
    expect(offenders, `server-side file(s) in dist/: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("assignment 1: the visitor does something that changes what they see", () => {
  it("has at least one interactive control beyond navigation links", () => {
    // Structural proxy only: real controls don't execute in this static HTML
    // parse, so this can't confirm the interaction actually changes the view
    // — it can only confirm there's something for a visitor to act on besides
    // "go to another page". The crit checks the rest.
    const INTERACTIVE_SELECTOR = "button, input, select, textarea, [role='button'], [tabindex]";
    const hasControl = pages.some((doc) => doc.querySelector(INTERACTIVE_SELECTOR) !== null);
    expect(
      hasControl,
      "no page has a button/input/select/textarea or interactive-role element — the brief asks the visitor to do something, not only read",
    ).toBe(true);
  });
});

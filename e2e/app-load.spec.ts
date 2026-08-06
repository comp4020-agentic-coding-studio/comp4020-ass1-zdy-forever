import { expect, test } from "@playwright/test";

test.describe("app load", () => {
  test("loads with no console errors and no failed requests", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));

    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Every Setting Costs Something");

    expect(consoleErrors, `console errors: ${consoleErrors.join(", ")}`).toEqual([]);
    expect(failedRequests, `failed requests: ${failedRequests.join(", ")}`).toEqual([]);
  });

  test("has exactly one h1 and a primary navigation landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });

  test("has an interactive control the visitor can act on beyond navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("radio").first()).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test("the reduce-motion toggle persists across a reload", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Reduce motion" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-reduce-motion", "true");

    await page.reload();
    await expect(page.getByRole("button", { name: "Reduce motion" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-reduce-motion", "true");
  });
});

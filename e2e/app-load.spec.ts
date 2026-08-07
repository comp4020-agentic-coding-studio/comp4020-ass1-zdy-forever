import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("camera-school-tutorial-complete", "true"));
});

test.describe("app load", () => {
  test("loads with no console errors and no failed requests", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));

    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Exposure Lab");
    await expect(page).toHaveTitle("Exposure Lab — Learn Manual Photography");

    expect(consoleErrors, `console errors: ${consoleErrors.join(", ")}`).toEqual([]);
    expect(failedRequests, `failed requests: ${failedRequests.join(", ")}`).toEqual([]);
  });

  test("has exactly one h1 and no redundant home navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Home" })).toHaveCount(0);
  });

  test("has an interactive control the visitor can act on beyond navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("radio").first()).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });
});

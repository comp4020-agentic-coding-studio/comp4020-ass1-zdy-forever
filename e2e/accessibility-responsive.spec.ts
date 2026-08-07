import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("camera-school-tutorial-complete", "true"));
});

test.describe("reduced motion", () => {
  test("honours the OS-level prefers-reduced-motion setting", async ({ page }) => {
    // No element declares a transition/animation of its own — the app's only
    // motion-related rule is the `@media (prefers-reduced-motion: reduce) *`
    // override, so proving it applies is proving reduced motion is honoured.
    await page.goto("/");
    const withoutPreference = await page.locator("body").evaluate((el) => getComputedStyle(el).animationDuration);
    expect(withoutPreference).toBe("0s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    const withPreference = await page.locator("body").evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(withPreference)).toBeLessThanOrEqual(0.001);
  });
});

test.describe("keyboard-only navigation", () => {
  test("tabbing reaches the scene selector then the camera controls in order", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // first (checked) scene radio

    await expect(page.getByRole("radio", { name: /^Portrait/ })).toBeFocused();

    // Roving tabindex: Tab again skips every other scene option and lands on
    // the comparison slider handle, not another radio.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("slider", { name: "Reveal original vs. simulated" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Decrease ISO" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#control-iso")).toBeFocused();
  });

  test("a keyboard-focused control shows a visible focus outline", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // first (checked) scene radio
    const firstScene = page.getByRole("radio", { name: /^Portrait/ });
    await expect(firstScene).toBeFocused();

    const outline = await firstScene.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });
});

for (const viewport of [
  { name: "desktop marking viewport", width: 1920, height: 1080 },
  { name: "phone marking viewport", width: 390, height: 844 },
  { name: "375", width: 375, height: 700 },
  { name: "768", width: 768, height: 900 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 900 },
]) {
  test(`no horizontal overflow at the ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

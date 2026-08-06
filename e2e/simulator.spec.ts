import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("camera controls", () => {
  test("stepping ISO with the +/- buttons updates the displayed value", async ({ page }) => {
    const output = page.locator('output[for="control-iso"]');
    await expect(output).toHaveText("ISO 200"); // Portrait scene default

    await page.getByRole("button", { name: "Increase ISO" }).click();
    await expect(output).toHaveText("ISO 400");

    await page.getByRole("button", { name: "Decrease ISO" }).click();
    await expect(output).toHaveText("ISO 200");
  });

  test("stepping is clamped at the ends of the value table", async ({ page }) => {
    const decrease = page.getByRole("button", { name: "Decrease Aperture" });
    for (let i = 0; i < 10; i += 1) {
      if (await decrease.isDisabled()) break;
      await decrease.click();
    }
    await expect(decrease).toBeDisabled();
    await expect(page.locator('output[for="control-aperture"]')).toHaveText("f/1.4");
  });

  test("arrow keys on a slider step it the same way as the buttons", async ({ page }) => {
    const shutterInput = page.locator("#control-shutterSeconds");
    const output = page.locator('output[for="control-shutterSeconds"]');
    await expect(output).toHaveText("1/125s");

    await shutterInput.focus();
    await shutterInput.press("ArrowRight"); // steps up the value table: slower shutter
    await expect(output).toHaveText("1/60s");

    await shutterInput.press("ArrowLeft");
    await expect(output).toHaveText("1/125s");
  });

  test("reset restores the scene's default settings", async ({ page }) => {
    await page.getByRole("button", { name: "Increase ISO" }).click();
    await page.getByRole("button", { name: "Increase ISO" }).click();
    await expect(page.locator('output[for="control-iso"]')).toHaveText("ISO 800");

    await page.getByRole("button", { name: "Reset to scene defaults" }).click();
    await expect(page.locator('output[for="control-iso"]')).toHaveText("ISO 200");
  });
});

test.describe("scenes", () => {
  test("switching scenes loads that scene's baseline settings", async ({ page }) => {
    await expect(page.locator('output[for="control-iso"]')).toHaveText("ISO 200");

    await page.getByRole("radio", { name: /^Landscape/ }).click();
    await expect(page.locator('output[for="control-iso"]')).toHaveText("ISO 100");
    await expect(page.locator('output[for="control-aperture"]')).toHaveText("f/8");
  });

  test("only the selected scene is in the tab order (roving tabindex)", async ({ page }) => {
    await expect(page.getByRole("radio", { name: /^Portrait/ })).toHaveAttribute("tabindex", "0");
    await expect(page.getByRole("radio", { name: /^Landscape/ })).toHaveAttribute("tabindex", "-1");
  });

  test("arrow keys move focus and selection between scenes", async ({ page }) => {
    const portrait = page.getByRole("radio", { name: /^Portrait/ });
    await portrait.focus();
    await portrait.press("ArrowRight");
    await expect(page.getByRole("radio", { name: /^Moving subject/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("radio", { name: /^Moving subject/ })).toBeFocused();
  });
});

test.describe("live feedback", () => {
  test("the explanation panel updates when a setting changes", async ({ page }) => {
    const panel = page.locator(".explanation-panel");
    const before = await panel.innerText();

    await page.getByRole("button", { name: "Increase ISO" }).click();
    await page.getByRole("button", { name: "Increase ISO" }).click();
    await page.getByRole("button", { name: "Increase ISO" }).click();

    await expect(panel).not.toHaveText(before);
  });

  test("the live exposure-triangle marker moves when settings change", async ({ page }) => {
    const marker = page.locator(".simulator-app .exposure-triangle-diagram__marker");
    const before = await marker.getAttribute("cy");

    await page.getByRole("button", { name: "Increase ISO" }).click();
    await page.getByRole("button", { name: "Increase ISO" }).click();
    await page.getByRole("button", { name: "Increase ISO" }).click();

    await expect
      .poll(async () => marker.getAttribute("cy"))
      .not.toBe(before);
  });

  test("the comparison slider handle can be moved with arrow keys", async ({ page }) => {
    const handle = page.getByRole("slider", { name: "Reveal original vs. simulated" });
    await expect(handle).toHaveValue("50");
    await handle.focus();
    await handle.press("ArrowRight");
    await expect(handle).toHaveValue("51");
  });
});

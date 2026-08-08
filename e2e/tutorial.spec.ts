import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function clickTimes(page: Page, name: string, times: number) {
  const button = page.getByRole("button", { name });
  for (let step = 0; step < times; step++) await button.click();
}

test("the guided path progresses from one dial to all three before unlocking challenges", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start with ISO →" }).click();
  await expect(page.getByRole("heading", { name: "ISO amplifies the signal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The challenges are unlocked" })).toHaveCount(0);

  await clickTimes(page, "Increase ISO", 4);
  await page.getByRole("button", { name: "Aperture — available" }).click();
  await expect(page.getByRole("heading", { name: "Aperture is the lens opening" })).toBeVisible();

  await clickTimes(page, "Decrease Aperture", 4);
  await page.getByRole("button", { name: "Shutter speed — available" }).click();
  await clickTimes(page, "Increase Shutter speed", 2);
  await page.getByRole("button", { name: "ISO + shutter — available" }).click();

  await clickTimes(page, "Increase ISO", 3);
  await clickTimes(page, "Increase Shutter speed", 4);
  await page.getByRole("button", { name: "The exposure triangle — available" }).click();

  await clickTimes(page, "Increase ISO", 3);
  await clickTimes(page, "Decrease Aperture", 4);
  await clickTimes(page, "Increase Shutter speed", 4);
  await page.getByRole("button", { name: "Challenges →" }).click();

  await expect(page.getByRole("heading", { name: "The challenges are unlocked" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Portrait/ })).toBeVisible();

  await page.getByRole("button", { name: "Review tutorials" }).click();
  await expect(page.getByRole("heading", { name: "ISO amplifies the signal" })).toBeVisible();
  await page.getByRole("button", { name: "The exposure triangle — completed" }).click();
  await expect(page.getByRole("heading", { name: "Now balance all three costs" })).toBeVisible();
  await page.getByRole("button", { name: "ISO — completed" }).click();
  await expect(page.getByRole("heading", { name: "ISO amplifies the signal" })).toBeVisible();
  await page.getByRole("button", { name: "ISO + shutter — completed" }).click();
  await expect(page.getByRole("heading", { name: "Two controls can pay the same light bill" })).toBeVisible();
});

test("the desktop workbench keeps the photograph, controls and triangle together", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop-only layout assertion");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Start with ISO →" }).click();

  const stageBox = await page.locator(".simulator-app__stage").boundingBox();
  const controlsBox = await page.locator(".camera-workbench__controls").boundingBox();
  const triangleBox = await page.locator(".camera-workbench__triangle").boundingBox();
  if (!stageBox || !controlsBox || !triangleBox) throw new Error("The camera workbench did not render");

  expect(Math.abs(stageBox.y - controlsBox.y)).toBeLessThan(2);
  expect(triangleBox.y + triangleBox.height).toBeLessThanOrEqual(900);

  await clickTimes(page, "Increase ISO", 4);
  const successOverlay = page.locator(".simulator-app__stage .success-overlay");
  await expect(successOverlay).toContainText("Lesson complete!");
  await expect(successOverlay).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("camera-school-tutorial-complete", "true"));
  await page.goto("/");
  // The save button is disabled until the first processed frame is ready.
  await expect(page.getByRole("button", { name: /^Save to album/ })).toBeEnabled();
});

test("saving adds an experiment to the album", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Album (0/6)" })).toBeVisible();

  await page.getByRole("button", { name: /^Save to album/ }).click();

  await expect(page.getByRole("heading", { name: "Album (1/6)" })).toBeVisible();
  await expect(page.locator(".album-strip__item")).toHaveCount(1);
});

test("the album is capped at 6 and blocks a 7th save", async ({ page }) => {
  const saveButton = page.getByRole("button", { name: /^Save to album/ });
  for (let i = 0; i < 6; i += 1) {
    await saveButton.click();
    await expect(page.getByRole("heading", { name: `Album (${i + 1}/6)` })).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Album (6/6)" })).toBeVisible();
  await expect(saveButton).toBeDisabled();
  await expect(page.locator(".album-strip__item")).toHaveCount(6);
});

test("removing an experiment frees its slot", async ({ page }) => {
  await page.getByRole("button", { name: /^Save to album/ }).click();
  await expect(page.getByRole("heading", { name: "Album (1/6)" })).toBeVisible();

  await page.locator(".album-strip__remove").click();

  await expect(page.getByRole("heading", { name: "Album (0/6)" })).toBeVisible();
  await expect(page.locator(".album-strip__empty")).toBeVisible();
});

test("clear album empties every saved experiment", async ({ page }) => {
  const saveButton = page.getByRole("button", { name: /^Save to album/ });
  await saveButton.click();
  await saveButton.click();
  await expect(page.getByRole("heading", { name: "Album (2/6)" })).toBeVisible();

  await page.getByRole("button", { name: "Clear album" }).click();

  await expect(page.getByRole("heading", { name: "Album (0/6)" })).toBeVisible();
  await expect(page.locator(".album-strip__item")).toHaveCount(0);
});

test("selecting two saved experiments opens the comparison view", async ({ page }) => {
  const saveButton = page.getByRole("button", { name: /^Save to album/ });
  await saveButton.click();

  await page.getByRole("button", { name: "Increase ISO" }).click();
  await page.getByRole("button", { name: "Increase ISO" }).click();
  await saveButton.click();
  await expect(page.getByRole("heading", { name: "Album (2/6)" })).toBeVisible();

  const thumbs = page.locator(".album-strip__thumb-button");
  await thumbs.nth(0).click();
  await thumbs.nth(1).click();

  await expect(page.getByRole("heading", { name: "Comparing two experiments" })).toBeVisible();
  await expect(page.locator(".album-comparison__frame")).toHaveCount(2);
  await expect(page.locator(".album-comparison__sentences li").first()).not.toBeEmpty();
});

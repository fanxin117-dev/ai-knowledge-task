import { expect, test } from "@playwright/test";

test("empty create forms show local errors without API 400 responses", async ({ page }) => {
  for (const route of ["/notes/new", "/tasks/new", "/projects/new", "/tags/new"]) {
    const apiErrors: number[] = [];
    const responseListener = (response: { url: () => string; status: () => number }) => {
      if (response.url().includes("/api/") && response.status() >= 400) {
        apiErrors.push(response.status());
      }
    };

    page.on("response", responseListener);
    await page.goto(route);
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator(".text-ember").first()).toBeVisible();

    const submitBox = await page.locator('button[type="submit"]').first().boundingBox();
    expect(submitBox?.height).toBeGreaterThanOrEqual(44);
    expect(apiErrors).toEqual([]);
    page.off("response", responseListener);
  }
});

test("mobile tag edit actions meet touch target size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tags");

  const editLinks = page.locator('a[href$="/edit"]');
  await expect(editLinks.first()).toBeVisible();

  for (const box of await editLinks.evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    }),
  )) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
});

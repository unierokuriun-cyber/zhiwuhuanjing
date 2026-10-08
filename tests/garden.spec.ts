import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [320, 812],
  [375, 812],
  [402, 874],
  [430, 932],
  [768, 1024],
  [1440, 900],
]) {
  test(`garden layout and images ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page).toHaveURL(/\/garden$/);
    await expect(page.getByRole("heading", { name: "我的植物" })).toBeVisible();
    await expect(page.locator(".plant-card")).toHaveCount(4);
    await page.locator(".plant-card").last().scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                (i as HTMLImageElement).complete &&
                (i as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width < 768) {
      await expect(
        page.getByRole("navigation", { name: "底部导航" }),
      ).toBeVisible();
      await expect(page.locator(".sidebar")).toBeHidden();
    } else {
      await expect(page.locator(".sidebar")).toBeVisible();
      await expect(page.locator(".mobile-nav")).toBeHidden();
    }
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `work/screenshots/garden-${width}.png`,
      fullPage: true,
    });
  });
}
test("filters, saved task, routes, and notifications", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/garden");
  await page.getByRole("button", { name: "阳台", exact: true }).click();
  await expect(page.locator(".plant-card")).toHaveCount(1);
  await page.getByRole("button", { name: "全部植物", exact: true }).click();
  const task = page.getByRole("button", {
    name: "完成给银皇后检查盆土",
    exact: true,
  });
  await task.click();
  await expect(
    page.getByRole("button", { name: "撤销给银皇后检查盆土", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "撤销给银皇后检查盆土", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".growth-panel")).toContainText("给银皇后检查盆土");
  await page.getByRole("button", { name: "查看提醒" }).click();
  await expect(page.getByRole("status")).toContainText("2 项待完成");
  await page.locator(".plant-card").first().click();
  await expect(page).toHaveURL(/\/plants\/plant-1$/);
  await expect(
    page.getByRole("heading", { name: "小森", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "回到我的花园" }).click();
  await page.getByRole("link", { name: "添加新植物" }).click();
  await expect(page).toHaveURL(/\/plants\/add$/);
  for (const [route, title] of [
    ["/care", "智能养护"],
    ["/companion", "植物伙伴"],
    ["/community", "植物社区"],
    ["/profile", "我的"],
  ]) {
    await page
      .getByRole("navigation", { name: "底部导航" })
      .getByRole("link", { name: title, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto("/care/calendar");
  await expect(
    page.getByRole("heading", { name: "养护日历", exact: true }),
  ).toBeVisible();
});
test("image failure provides accessible fallback", async ({ page }) => {
  await page.route("**/images/monstera.webp", (route) => route.abort());
  await page.goto("/garden");
  await expect(
    page.getByRole("img", { name: "龟背竹，图片暂时无法加载" }),
  ).toBeVisible();
});
test("storage failure is visible and tasks stay usable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/garden");
  await page
    .getByRole("button", { name: "完成给银皇后检查盆土", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("本次修改暂时无法保存");
  await expect(
    page.getByRole("button", { name: "撤销给银皇后检查盆土", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("corrupt saved data recovers with an explicit message", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("plant-companion-garden-v1", "invalid-json"),
  );
  await page.goto("/garden");
  await expect(page.getByRole("alert")).toContainText("本地记录暂时无法读取");
  await expect(page.locator(".plant-card")).toHaveCount(4);
});

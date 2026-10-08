import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [375, 812],
  [402, 874],
  [768, 1024],
  [1440, 900],
]) {
  test(`plant management layouts ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const [route, name] of [
      ["/garden", "garden"],
      ["/plants/add", "add"],
      ["/plants/plant-1", "detail"],
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
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
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `work/screenshots/phase2-${name}-${width}.png`,
        fullPage: true,
      });
    }
  });
}
test("add two plants of same species, edit, care history and persistence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/plants/add");
  await page.getByLabel("植物昵称").fill("我的第二株小森");
  await page.getByLabel("种植环境").selectOption("阳台");
  await page.getByLabel("生长阶段").selectOption("幼苗期");
  await page.getByLabel("主要养护目标").selectOption("保持健康");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.locator(".plant-card")).toHaveCount(5);
  await page.getByRole("link", { name: /我的第二株小森/ }).click();
  const plantUrl = page.url();
  await expect(
    page.getByRole("heading", { name: "我的第二株小森", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".plant-facts")).toContainText("幼苗期");
  for (const kind of ["浇水", "施肥", "修剪"]) {
    await page
      .getByRole("button", { name: `记录${kind}`, exact: true })
      .click();
    await page.getByRole("button", { name: "确认记录", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(`已记录${kind}`);
  }
  await expect(page.locator(".history-entry")).toHaveCount(3);
  await expect(page.locator(".plant-facts")).toContainText("50 XP");
  await page.reload();
  await expect(page.locator(".history-entry")).toHaveCount(3);
  await page.getByRole("link", { name: "编辑档案" }).click();
  await page.getByLabel("植物昵称").fill("阳台上的小森林");
  await page.getByLabel("主要养护目标").selectOption("维持株形");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page).toHaveURL(/\/garden$/);
  await page.getByRole("link", { name: /阳台上的小森林/ }).click();
  await expect(page.locator(".plant-facts")).toContainText("维持株形");
  await expect(page.locator(".history-entry")).toHaveCount(3);
  await page.goto("/plants/add");
  await page.getByLabel("植物昵称").fill("第三株小森");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await expect(page.locator(".plant-card")).toHaveCount(6);
  await page.goto(plantUrl);
  await expect(
    page.getByRole("heading", { name: "阳台上的小森林", exact: true }),
  ).toBeVisible();
});
test("image upload, invalid input, and unknown plant", async ({ page }) => {
  await page.goto("/plants/add");
  await page.getByLabel("植物昵称").fill("照片植物");
  await page
    .getByLabel("选择植物图片")
    .setInputFiles("public/images/rubber.jpg");
  await expect(page.getByRole("img", { name: "植物图片预览" })).toHaveAttribute(
    "src",
    /^data:image\/jpeg/,
  );
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await page.getByRole("link", { name: /照片植物/ }).click();
  await page.reload();
  await expect(page.locator(".detail-visual img")).toHaveAttribute(
    "src",
    /^data:image\/jpeg/,
  );
  await page.goto("/plants/add");
  await page.getByLabel("选择植物图片").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("JPG");
  await page.getByLabel("植物昵称").fill("   ");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("昵称");
  await page.goto("/plants/missing");
  await expect(
    page.getByRole("heading", { name: "没有找到这株植物" }),
  ).toBeVisible();
});
test("idempotent submissions and task XP rollback", async ({ page }) => {
  await page.goto("/garden");
  const result = await page.evaluate(async () => {
    const { useGarden } = await import("/src/store/garden.ts");
    const s = useGarden.getState();
    s.recordCare("plant-1", "water", "same-operation");
    s.recordCare("plant-1", "water", "same-operation");
    s.toggleTask("task-1");
    s.toggleTask("task-1");
    s.toggleTask("task-1");
    const state = useGarden.getState();
    return {
      same: state.records.filter(
        (r: { id: string }) => r.id === "same-operation",
      ).length,
      task: state.records.filter((r: { id: string }) => r.id === "task-1")
        .length,
      xp: state.records.reduce((n: number, r: { xp: number }) => n + r.xp, 0),
    };
  });
  expect(result).toEqual({ same: 1, task: 1, xp: 20 });
});

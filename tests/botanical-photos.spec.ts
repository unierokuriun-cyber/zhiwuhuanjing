import { test, expect } from "@playwright/test";
const ids = [
  "monstera",
  "pothos",
  "fiddle-leaf-fig",
  "snake-plant",
  "bougainvillea",
  "mint",
  "rosemary",
  "tomato",
];
for (const [width, height] of [
  [402, 874],
  [1440, 900],
]) {
  test(`botanical photographs and responsive layouts ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.request.get("/images/botanical-atlas.webp");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/webp");
    await page.goto("/garden");
    await expect(page.locator(".botanical-gallery-card")).toHaveCount(8);
    expect(
      await page
        .locator(".botanical-gallery-card svg[data-photo-species]")
        .evaluateAll(
          (nodes) => new Set(nodes.map((n) => n.getAttribute("viewBox"))).size,
        ),
    ).toBe(8);
    await page.locator(".botanical-gallery").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `work/screenshots/botanical-gallery-${width}.png`,
      fullPage: true,
    });
    for (const route of [
      "/garden",
      "/care",
      "/community",
      "/plants/add?species=tomato",
      "/community/channels/bougainvillea",
      "/community/channels/tomato",
      "/community/channels/mint",
      "/community/channels/pothos",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await expect(
        page.locator("svg[data-photo-species]").first(),
        route,
      ).toBeVisible();
    }
    await page.screenshot({
      path: `work/screenshots/botanical-channel-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
test("eight portraits select correct species and keep original custom uploads", async ({
  page,
}) => {
  await page.goto("/garden");
  for (const id of ids) {
    await page.goto(`/plants/add?species=${id}`);
    await expect(page.getByLabel("植物品种")).toHaveValue(id);
    await expect(
      page.locator(".form-photo svg[data-photo-species]"),
    ).toHaveAttribute("data-photo-species", id);
  }
  await page.getByLabel("植物昵称").fill("新照片小番茄");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await page.getByRole("link", { name: /新照片小番茄/ }).click();
  await expect(
    page.locator(".detail-visual svg[data-photo-species]"),
  ).toHaveAttribute("data-photo-species", "tomato");
  await page.reload();
  await expect(
    page.locator(".detail-visual svg[data-photo-species]"),
  ).toHaveAttribute("data-photo-species", "tomato");
  await page.goto("/plants/add?species=mint");
  await page.getByLabel("选择植物图片").setInputFiles("public/images/hero.jpg");
  await expect(page.locator(".form-photo > img")).toHaveAttribute(
    "src",
    /^data:image\/jpeg/,
  );
});
test("legacy system photos adapt without mutating saved records", async ({
  page,
}) => {
  await page.goto("/garden");
  const result = await page.evaluate(async () => {
    const { resolvePlantPhoto } = await import("/src/services/plantPhotos.ts");
    return {
      old: resolvePlantPhoto("/images/hero.webp", "tomato"),
      custom: resolvePlantPhoto("data:image/png;base64,custom", "tomato"),
      other: resolvePlantPhoto("/images/rubber.webp", "rubber"),
    };
  });
  expect(result.old).toBe("/images/botanical-atlas.webp#tomato");
  expect(result.custom).toBe("data:image/png;base64,custom");
  expect(result.other).toBe("/images/rubber.webp");
});

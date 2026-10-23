import { test, expect } from "@playwright/test";
test("52 demo posts have independent thematic pictures", async ({ page }) => {
  await page.goto("/community");
  await expect(page.locator(".community-post-card").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { mockPosts } = await import("/src/mock/community.ts");
    return {
      count: mockPosts.length,
      unique: new Set(mockPosts.map((p) => p.images[0])).size,
      photos: mockPosts.map((p) => ({ type: p.postType, photo: p.images[0] })),
    };
  });
  expect(result.count).toBe(52);
  expect(result.unique).toBe(52);
  for (const p of result.photos) {
    const theme = {
      养护攻略: "guides",
      问题求助: "questions",
      成长分享: "growth",
      日常交流: "daily",
    }[p.type];
    expect(p.photo).toContain(`community-${theme}.webp#`);
  }
});
for (const width of [402, 1440])
  test(`editorial photo previews ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 402 ? 874 : 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const channel of ["foliage", "pothos", "tomato", "mint"]) {
      await page.goto(`/community/channels/${channel}`);
      await expect(page.locator(".community-post-card")).toHaveCount(4);
      await expect(
        page.locator(".community-post-card [data-community-photo]"),
      ).toHaveCount(4);
      expect(
        new Set(
          await page
            .locator(".community-post-card [data-community-photo]")
            .evaluateAll((nodes) =>
              nodes.map((n) => n.getAttribute("data-community-photo")),
            ),
        ).size,
      ).toBe(4);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.locator(".community-post-card").first().click();
    await expect(
      page.locator(".post-image-grid [data-community-photo]"),
    ).toBeVisible();
    await expect(
      page.locator(".form-note").filter({ hasText: "AI 生成的主题示意" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
test("failed editorial image has accessible fallback", async ({ page }) => {
  await page.route("**/images/community-guides.webp", (r) => r.abort());
  await page.goto("/community/channels/pothos");
  await expect(
    page.getByRole("img", {
      name: "绿萝 · 观察与养护入门，图片暂时无法加载",
      exact: true,
    }),
  ).toBeVisible();
});

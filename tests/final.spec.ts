import { test, expect } from "@playwright/test";
const routes = [
  "/garden",
  "/plants/add",
  "/plants/plant-1",
  "/plants/plant-1/edit",
  "/care",
  "/care/identify",
  "/care/chat",
  "/care/diagnosis",
  "/care/calendar",
  "/care/watering",
  "/care/fertilizing",
  "/care/pruning",
  "/companion",
  "/companion/chat/plant-1",
  "/companion/achievements",
  "/companion/garden",
  "/community",
  "/community/channels/bougainvillea",
  "/community/channels/tomato",
  "/community/posts/demo-tomato-0",
  "/community/create",
  "/community/search?q=薄荷",
  "/profile",
  "/profile/posts",
  "/profile/favorites",
  "/profile/edit",
  "/profile/devices",
  "/profile/settings",
];
for (const [width, height] of [
  [320, 700],
  [375, 812],
  [402, 874],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1440, 900],
]) {
  test(`release routes and responsive layout ${width}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).not.toHaveText("花园暂时无法打开");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      if (width < 768) {
        await expect(
          page.getByRole("navigation", { name: "底部导航" }),
        ).toBeVisible();
      }
      if (
        [
          "/garden",
          "/care",
          "/companion",
          "/community",
          "/profile/settings",
        ].includes(route)
      )
        await page.screenshot({
          path: `work/screenshots/phase6-${route.replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
        });
    }
    expect(errors).toEqual([]);
  });
}
test("profile and reminders persist without changing plant records", async ({
  page,
}) => {
  await page.goto("/profile/edit");
  await page.getByLabel("用户昵称").fill("阳台园丁");
  await page.getByLabel("个人介绍").fill("每天观察盆土");
  await page.getByRole("button", { name: "保存资料" }).click();
  await page.goto("/garden");
  await expect(page.locator("h1")).toContainText("阳台园丁");
  await expect(page.locator(".plant-card")).toHaveCount(4);
  await page.goto("/profile/settings");
  await page.getByRole("checkbox").uncheck();
  await page.reload();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.goto("/garden");
  await page.getByRole("button", { name: "查看提醒" }).click();
  await expect(page.getByRole("status")).toContainText("页面内提醒已关闭");
  await page.goto("/profile/devices");
  await expect(page.locator(".device-list a")).toHaveCount(4);
  await expect(page.locator(".care-card")).toContainText("没有连接真实设备");
});
test("damaged storage never overwritten by a fallback mutation and recovery retains backup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("plant-companion-garden-v1", "invalid-json");
      sessionStorage.setItem("seeded", "1");
    }
  });
  await page.goto("/garden");
  await page
    .getByRole("button", { name: "完成给银皇后检查盆土", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("plant-companion-garden-v1"),
    ),
  ).toBe("invalid-json");
  await page.goto("/profile/settings");
  await page
    .getByRole("button", { name: "恢复当前可用数据", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("plant-companion-garden-v1"),
    ),
  ).toBe("invalid-json");
  await page
    .getByRole("button", { name: "恢复当前可用数据", exact: true })
    .click();
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("恢复成功");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some(
        (k) =>
          k.includes("-recovery-") &&
          localStorage.getItem(k) === "invalid-json",
      ),
    ),
  ).toBe(true);
  await page.goto("/garden");
  await expect(page.locator(".plant-card")).toHaveCount(4);
});
test("invalid data shape is protected and unknown routes are not placeholders", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "plant-companion-garden-v1",
      JSON.stringify({
        version: 4,
        state: { plants: "broken", tasks: [], records: [] },
      }),
    ),
  );
  await page.goto("/garden");
  await expect(page.getByRole("alert")).toContainText("暂停覆盖");
  await expect(page.locator(".plant-card")).toHaveCount(4);
  await page.goto("/care/not-real");
  await expect(page.locator("h1")).toHaveText("页面未找到");
  await page.goto("/profile/not-real");
  await expect(page.locator("h1")).toHaveText("页面未找到");
});
test("user text renders literally and deleted plants reject late care chat messages", async ({
  page,
}) => {
  await page.goto("/profile/edit");
  const text = "<img src=x onerror=alert(1)>";
  await page.getByLabel("用户昵称").fill(text.slice(0, 24));
  await page.getByRole("button", { name: "保存资料" }).click();
  await page.goto("/garden");
  await expect(page.locator("h1")).toContainText(text.slice(0, 24));
  expect(await page.locator("h1 img").count()).toBe(0);
  const orphan = await page.evaluate(async () => {
    const { useGarden } = await import("/src/store/garden.ts");
    useGarden.getState().deletePlant("plant-1");
    useGarden.getState().addMessage({
      id: "late",
      plantId: "plant-1",
      role: "assistant",
      text: "late reply",
      at: new Date().toISOString(),
    });
    return useGarden.getState().messages.some((m) => m.plantId === "plant-1");
  });
  expect(orphan).toBe(false);
});

test("release A–E integrated journey survives browser reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/plants/add");
  await page.getByLabel("植物品种").selectOption("tomato");
  await page.getByLabel("植物昵称").fill("验收小番茄");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await page.getByRole("link", { name: /验收小番茄/ }).click();
  const id = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "记录浇水", exact: true }).click();
  await page.getByRole("button", { name: "确认记录", exact: true }).click();
  await expect(page.locator(".history-entry")).toHaveCount(1);
  await page.goto("/care/watering");
  await page.getByLabel("关联植物").selectOption(id);
  await expect(page.locator(".management-advice").first()).toBeVisible();
  await page.goto("/care/chat");
  await page.getByLabel("关联植物").selectOption(id);
  await page.getByLabel("输入养护问题").fill("小番茄叶子发黄怎么办？");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect(page.locator(".chat-message.assistant")).toBeVisible();
  await page.goto("/care/calendar");
  await expect(page.locator("h1")).toHaveText("养护日历");
  await page.goto(`/companion?plant=${id}`);
  await page.getByRole("button", { name: "打招呼", exact: true }).click();
  await expect(page.locator(".partner-level")).toContainText("35 XP");
  await page.getByRole("button", { name: "打招呼", exact: true }).click();
  await expect(page.locator(".partner-level")).toContainText("35 XP");
  await page.goto("/companion/achievements");
  await expect(page.locator(".achievement.unlocked")).toHaveCount(2);
  await page.goto("/community");
  await page.getByRole("tab", { name: "观赏性植物", exact: true }).click();
  await page
    .locator(".channel-scroller")
    .getByRole("link", { name: "三角梅", exact: true })
    .click();
  await page.getByRole("button", { name: "养护攻略", exact: true }).click();
  await page.locator(".community-post-card").click();
  await page.getByRole("button", { name: /^收藏 / }).click();
  await page.goto("/community/create?channel=tomato");
  await page.getByLabel("帖子类型").selectOption("成长分享");
  await page.getByLabel("帖子标题").fill("第六阶段成长验收");
  await page
    .getByLabel("帖子正文")
    .fill("今天观察小番茄并记录浇水，继续关注实际盆土。");
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "发布成功" }),
  ).toBeVisible();
  await page.goto("/profile/posts");
  await page.reload();
  await expect(page.locator(".community-post-card")).toContainText(
    "第六阶段成长验收",
  );
  await page.goto("/profile/favorites");
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  await page.goto(`/plants/${id}`);
  await expect(page.locator(".history-entry")).toHaveCount(1);
  await expect(page.locator(".plant-facts")).toContainText("35 XP");
  await page.goto("/care/chat");
  await page.getByLabel("关联植物").selectOption(id);
  await expect(page.locator(".chat-message")).toHaveCount(2);
});

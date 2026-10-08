import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [375, 812],
  [402, 874],
  [768, 1024],
  [1440, 900],
]) {
  test(`care pages responsive ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of [
      "care",
      "care/identify",
      "care/chat",
      "care/diagnosis",
      "care/calendar",
      "care/watering",
      "care/fertilizing",
      "care/pruning",
    ]) {
      await page.goto("/" + route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (["care", "care/chat", "care/calendar"].includes(route))
        await page.screenshot({
          path: `work/screenshots/phase3-${route.replace("/", "-")}-${width}.png`,
          fullPage: true,
        });
    }
    expect(errors).toEqual([]);
  });
}
test("identify upload, candidates and confirmed new profile", async ({
  page,
}) => {
  await page.goto("/care/identify");
  await page
    .getByLabel("上传植物照片")
    .setInputFiles("public/images/monstera.jpg");
  await expect(page.getByRole("img", { name: "上传照片预览" })).toBeVisible();
  await page.getByRole("button", { name: "开始模拟识别" }).click();
  await expect(page.getByRole("status")).toContainText("演示结果");
  await expect(page.locator(".candidate-list button")).toHaveCount(4);
  await page.getByRole("button", { name: /三角梅.*模拟置信度/ }).click();
  await page.getByRole("button", { name: "确认结果并创建档案" }).click();
  await expect(page).toHaveURL(/garden$/);
  await expect(page.locator(".plant-card")).toHaveCount(5);
  await page.getByRole("link", { name: /三角梅.*Bougainvillea/ }).click();
  await expect(page.locator("h1")).toHaveText("三角梅");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("三角梅");
});
test("chat keyboard, loading, associated history and persistence", async ({
  page,
}) => {
  await page.goto("/care/chat");
  await page.getByLabel("输入养护问题").fill("龟背竹需要多少光照？");
  await page.getByLabel("输入养护问题").press("Enter");
  await expect(page.getByRole("button", { name: "发送问题" })).toBeDisabled();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "模拟规则回复",
  );
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "观赏枝叶",
  );
  await expect(page.locator(".chat-message.assistant")).toContainText("小森");
  await page.reload();
  await expect(page.locator(".chat-message")).toHaveCount(2);
  await page.getByLabel("关联植物").selectOption("plant-2");
  await expect(page.locator(".chat-message")).toHaveCount(0);
  await page.getByLabel("输入养护问题").fill("应该检查什么？");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect(page.locator(".chat-message.assistant")).toContainText("银银");
});
test("diagnosis text observation saves once without XP", async ({ page }) => {
  await page.goto("/care/diagnosis");
  await page
    .getByLabel("上传植物照片")
    .setInputFiles("public/images/rubber.jpg");
  await page.getByLabel("补充养护环境").fill("近期换盆，盆土较湿");
  await page.getByRole("button", { name: "开始模拟分析" }).click();
  await expect(page.locator(".diagnosis-result")).toContainText("可能原因");
  await page.getByRole("button", { name: "保存观察记录" }).click();
  await expect(
    page.getByRole("button", { name: "观察记录已保存" }),
  ).toBeDisabled();
  await page.goto("/plants/plant-1");
  await expect(page.locator(".history-entry")).toHaveCount(1);
  await expect(page.locator(".history-entry")).toContainText("近期换盆");
  await expect(page.locator(".plant-facts")).toContainText("0 XP");
  await page.reload();
  await expect(page.locator(".history-entry")).toHaveCount(1);
});
test("calendar task sharing, defer, skip and custom date", async ({ page }) => {
  await page.goto("/care/calendar");
  await page.getByRole("button", { name: "周视图", exact: true }).click();
  await expect(page.locator(".calendar-grid button")).toHaveCount(7);
  await page.getByRole("button", { name: "月视图", exact: true }).click();
  await expect(page.locator(".calendar-grid button")).toHaveCount(42);
  await page
    .locator(".calendar-task")
    .first()
    .getByRole("button", { name: "完成", exact: true })
    .click();
  await page.goto("/garden");
  await expect(
    page.getByRole("button", { name: "撤销给银皇后检查盆土" }),
  ).toBeVisible();
  await page.goto("/care/calendar");
  await page
    .locator(".calendar-task")
    .nth(1)
    .getByRole("button", { name: "延迟一天" })
    .click();
  await expect(page.locator(".calendar-task")).toHaveCount(2);
  await page
    .locator(".calendar-task")
    .last()
    .getByRole("button", { name: "跳过", exact: true })
    .click();
  await expect(page.locator(".calendar-task").last()).toContainText("已跳过");
  await page.getByLabel("任务名称").fill("检查新叶");
  await page.getByRole("button", { name: "添加任务", exact: true }).click();
  await expect(page.locator(".calendar-task")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".calendar-task")).toHaveCount(3);
});
test("species rules and repeated complete are idempotent", async ({ page }) => {
  await page.goto("/care");
  const result = await page.evaluate(async () => {
    const { useGarden } = await import("/src/store/garden.ts");
    const { adviceFor } = await import("/src/services/care.ts");
    const s = useGarden.getState();
    s.completeTask("task-1");
    s.completeTask("task-1");
    const p = s.plants[0];
    return {
      records: useGarden
        .getState()
        .records.filter((r: { id: string }) => r.id === "task-1").length,
      tomato: adviceFor(
        {
          ...p,
          speciesId: "tomato",
          goal: "果实采收",
          stage: "结果期",
          location: "阳台",
        },
        [],
      ),
      flower: adviceFor(
        { ...p, speciesId: "bougainvillea", goal: "促进开花" },
        [],
      ),
    };
  });
  expect(result.records).toBe(1);
  expect(result.tomato.stage).toContain("果实采收");
  expect(result.tomato.prune).toContain("侧芽");
  expect(result.flower.prune).toContain("花芽");
  expect(result.tomato.weather).toContain("阳台");
});

test("mock failures show retry paths and invalid uploads", async ({ page }) => {
  await page.route("**/src/services/care.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body:
        (await response.text()) +
        '\ncareService.chat=async()=>{throw new Error("test failure")};\n',
    });
  });
  await page.goto("/care/chat");
  await page.getByLabel("输入养护问题").fill("如何浇水？");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect(page.getByRole("alert")).toContainText("模拟回复失败");
  await expect(page.getByLabel("输入养护问题")).toHaveValue("如何浇水？");
  await expect(page.getByRole("button", { name: "发送问题" })).toBeEnabled();
  await page.goto("/care/identify");
  await page
    .getByLabel("上传植物照片")
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("5MB");
});
test("version 2 records migrate and empty plant states remain usable", async ({
  page,
}) => {
  await page.goto("/garden");
  await page
    .getByRole("button", { name: "完成给银皇后检查盆土", exact: true })
    .click();
  const snapshot = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("plant-companion-garden-v1")!),
  );
  snapshot.version = 2;
  delete snapshot.state.messages;
  for (const task of snapshot.state.tasks) {
    delete task.date;
    delete task.status;
  }
  await page.evaluate(
    (s) => localStorage.setItem("plant-companion-garden-v1", JSON.stringify(s)),
    snapshot,
  );
  await page.reload();
  await page.goto("/care/calendar");
  await expect(page.locator(".calendar-task")).toHaveCount(3);
  await page.goto("/care/chat");
  await page.getByLabel("输入养护问题").fill("看看盆土");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect(page.locator(".chat-message.assistant")).toBeVisible();
  await page.evaluate(async () => {
    const { useGarden } = await import("/src/store/garden.ts");
    useGarden.setState({ plants: [], tasks: [], records: [], messages: [] });
  });
  await page.goto("/care");
  await expect(
    page.getByRole("heading", { name: "先为花园添加一株植物" }),
  ).toBeVisible();
  await page.goto("/care/chat");
  await expect(
    page.getByRole("link", { name: "添加植物", exact: true }),
  ).toBeVisible();
});

test('observation does not become recent care after task rollback',async({page})=>{
 await page.goto('/care');const result=await page.evaluate(async()=>{const {useGarden}=await import('/src/store/garden.ts');const s=useGarden.getState();s.completeTask('task-1');s.addObservation('plant-2','观察叶片','observation-test');s.toggleTask('task-1');return {last:useGarden.getState().plants.find((p:{id:string})=>p.id==='plant-2')?.lastCareAt,xp:useGarden.getState().records.reduce((n:number,r:{xp:number})=>n+r.xp,0)}});expect(result.last).toBeUndefined();expect(result.xp).toBe(0);
});

import { test, expect } from "@playwright/test";
for (const [width, height] of [
  [375, 812],
  [402, 874],
  [768, 1024],
  [1440, 900],
]) {
  test(`community routes and layouts ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [route, selector, name] of [
      ["/community", ".community-post-card", "home"],
      ["/community/channels/tomato", ".community-post-card", "channel"],
      ["/community/posts/demo-tomato-0", ".post-detail", "post"],
      ["/community/create", ".create-post-form", "create"],
      ["/community/search?q=小番茄", ".community-post-card", "search"],
      ["/profile", ".profile-community-stats", "profile"],
    ]) {
      await page.goto(route);
      await expect(page.locator(selector).first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `work/screenshots/phase5-${name}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}
test("practical plants to tomato guide, favorite, growth post and my profile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/community");
  await page.getByRole("tab", { name: "实用性植物", exact: true }).click();
  await expect(page.locator(".channel-chip")).toHaveCount(6);
  await page
    .locator(".channel-scroller")
    .getByRole("link", { name: "小番茄", exact: true })
    .click();
  await page.getByRole("button", { name: "养护攻略", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  await page.locator(".community-post-card").click();
  await expect(page.locator(".post-detail h2").first()).toContainText("小番茄");
  await page.getByRole("button", { name: /^收藏 / }).click();
  await expect(page.getByRole("button", { name: /^收藏 / })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/profile/favorites");
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  await page.goto("/community/create?channel=tomato");
  await page.getByLabel("帖子类型").selectOption("成长分享");
  await page.getByLabel("帖子标题").fill("我的第一颗小番茄");
  await page
    .getByLabel("帖子正文")
    .fill("今天认真观察了叶片，记录新的生长变化。");
  await page.getByLabel("植物标签").fill("小番茄,阳台,成长");
  await page.getByRole("button", { name: "预览内容" }).click();
  await expect(page.locator(".create-post-preview")).toContainText(
    "我的第一颗小番茄",
  );
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "发布成功" }),
  ).toContainText("发布成功");
  await page.goto("/profile/posts");
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  await expect(page.locator(".community-post-card")).toContainText(
    "我的第一颗小番茄",
  );
  await page.reload();
  await expect(page.locator(".community-post-card")).toHaveCount(1);
});
test("channel follow, real type filtering, sort and following feed", async ({
  page,
}) => {
  await page.goto("/community/channels/tomato");
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page
    .getByRole("button", { name: "关注小番茄频道", exact: true })
    .click();
  await page.getByRole("button", { name: "问题求助", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  await expect(page.locator(".community-post-card")).toContainText("发黄");
  await page.getByRole("button", { name: "最新", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page.goto("/community");
  await page.getByRole("tab", { name: "关注", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page.reload();
  await page.getByRole("tab", { name: "关注", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page.goto("/community/channels/tomato");
  await page
    .getByRole("button", { name: "取消关注小番茄频道", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "关注小番茄频道", exact: true }),
  ).toBeVisible();
});
test("search channels, body keywords, tags, history and empty results", async ({
  page,
}) => {
  await page.goto("/community/search");
  await page.getByLabel("社区搜索关键词").fill("薄荷");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.locator(".search-channels")).toContainText("薄荷");
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page.getByLabel("社区搜索关键词").fill("排水");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.locator(".community-post-card").first()).toBeVisible();
  await page.getByLabel("社区搜索关键词").fill("阳台种菜");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(4);
  await page.getByLabel("社区搜索关键词").fill("不存在的植物关键词123");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.locator(".community-post-card")).toHaveCount(0);
  await expect(page.locator(".search-suggestions")).toContainText("薄荷");
  await page.reload();
  await expect(page.locator(".search-suggestions")).toContainText("薄荷");
  await page.getByRole("button", { name: "清空历史" }).click();
  await expect(page.locator(".search-suggestions")).toContainText(
    "还没有搜索记录",
  );
});
test("likes, favorites and own comments stay consistent after reload and deletion", async ({
  page,
}) => {
  await page.goto("/community/posts/demo-tomato-0");
  await expect(page.locator(".post-detail")).toBeVisible();
  const initialLike = await page
    .getByRole("button", { name: /^点赞 / })
    .innerText();
  await page.getByRole("button", { name: /^点赞 / }).click();
  await expect(page.getByRole("button", { name: /^点赞 / })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /^点赞 / }).click();
  await expect(page.getByRole("button", { name: /^点赞 / })).toHaveText(
    initialLike,
  );
  await page.getByLabel("评论内容").fill("我的本地观察");
  await page.getByRole("button", { name: "发布评论", exact: true }).click();
  await expect(page.locator(".community-comment")).toHaveCount(2);
  await expect(page.locator(".comment-panel h2")).toHaveText("评论 · 2");
  await page.reload();
  await expect(page.locator(".community-comment")).toHaveCount(2);
  await page.getByRole("button", { name: "删除我的评论" }).click();
  await page.getByRole("button", { name: "确认删除评论" }).click();
  await expect(page.locator(".community-comment")).toHaveCount(1);
  await expect(page.locator(".comment-panel h2")).toHaveText("评论 · 1");
  const result = await page.evaluate(async () => {
    const { communityService } = await import("/src/services/community.ts");
    const { useCommunity } = await import("/src/store/community.ts");
    await communityService.likePost("demo-tomato-0", true);
    await communityService.likePost("demo-tomato-0", true);
    await communityService.favoritePost("demo-tomato-0", true);
    await communityService.favoritePost("demo-tomato-0", true);
    await communityService.createComment(
      "demo-tomato-0",
      "重复提交",
      "same-comment",
    );
    await communityService.createComment(
      "demo-tomato-0",
      "重复提交",
      "same-comment",
    );
    return {
      likes: useCommunity.getState().liked.length,
      favs: useCommunity.getState().favorites.length,
      comments: useCommunity.getState().comments.length,
    };
  });
  expect(result).toEqual({ likes: 1, favs: 1, comments: 1 });
});
test("community photos are IndexedDB blobs and survive refresh without base64 localStorage", async ({
  page,
}) => {
  await page.goto("/community/create?channel=tomato");
  await page.getByLabel("帖子标题").fill("本地照片测试");
  await page.getByLabel("帖子正文").fill("图片保存在 IndexedDB。");
  await page.getByLabel("选择帖子图片").setInputFiles("public/images/hero.jpg");
  await expect(page.getByRole("img", { name: "发帖图片预览 1" })).toBeVisible();
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "发布成功" }),
  ).toContainText("发布成功");
  await expect(page.locator(".post-image-grid img")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.reload();
  await expect(page.locator(".post-image-grid img")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  expect(
    await page.evaluate(() =>
      localStorage
        .getItem("plant-companion-community-v1")
        ?.includes("data:image"),
    ),
  ).toBe(false);
  const refs = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("plant-companion-community-v1")!).state
        .userPosts[0].images,
  );
  expect(refs[0]).toMatch(/^idb:/);
});
test("plant recommendations, care guide and active sharing of growth record", async ({
  page,
}) => {
  await page.goto("/plants/add");
  await page.getByLabel("植物品种").selectOption("tomato");
  await page.getByLabel("植物昵称").fill("我的番茄伙伴");
  await page.getByRole("button", { name: "保存植物档案", exact: true }).click();
  await expect(page.locator(".garden-community-panel")).toContainText("小番茄");
  await page.getByRole("link", { name: /我的番茄伙伴/ }).click();
  const id = page.url().split("/").pop()!;
  await expect(
    page.getByRole("link", { name: "到小番茄频道交流" }),
  ).toBeVisible();
  await page.goto("/care");
  await page.getByLabel("关联植物").selectOption(id);
  await expect(page.locator(".care-community-guides")).toContainText("小番茄");
  await page.goto(`/companion?plant=${id}`);
  await page.getByLabel("成长观察").fill("发现番茄的新花苞");
  await page.getByRole("button", { name: "保存成长记录" }).click();
  await page.goto(`/plants/${id}`);
  await page.getByRole("link", { name: "分享成长记录" }).click();
  await expect(page.getByLabel("帖子正文")).toHaveValue("发现番茄的新花苞");
  await expect(page.getByLabel("植物频道")).toHaveValue("tomato");
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "发布成功" }),
  ).toContainText("发布成功");
  await expect(
    page.getByRole("link", { name: "我的番茄伙伴的植物档案" }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(page.locator(".community-milestone")).toContainText("已解锁");
  await page.goto(`/plants/${id}`);
  await expect(page.locator(".plant-facts")).toContainText("30 XP");
});
test("unknown routes, validation, loading and service failure retry", async ({
  page,
}) => {
  await page.goto("/community/channels/missing");
  await expect(page.getByRole("heading", { name: "频道不存在" })).toBeVisible();
  await page.goto("/community/posts/missing");
  await expect(page.getByRole("heading", { name: "帖子不存在" })).toBeVisible();
  await page.goto("/community/create");
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("标题与正文");
  await page
    .getByLabel("选择帖子图片")
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("JPG");
  await page.route("**/src/services/community.ts*", async (route) => {
    const r = await route.fetch();
    await route.fulfill({
      response: r,
      body:
        (await r.text()) +
        '\ncommunityService.getPosts=async()=>{throw new Error("社区测试错误")};\n',
    });
  });
  await page.goto("/community");
  await expect(page.getByRole("alert")).toContainText("社区测试错误");
  await expect(page.getByRole("button", { name: "重新加载" })).toBeVisible();
});
test("post submission IDs prevent duplicate publication and garden data remains compatible", async ({
  page,
}) => {
  await page.goto("/community");
  const result = await page.evaluate(async () => {
    const { communityService } = await import("/src/services/community.ts");
    const { useCommunity } = await import("/src/store/community.ts");
    const { useGarden } = await import("/src/store/garden.ts");
    const before = JSON.stringify({
      plants: useGarden.getState().plants,
      records: useGarden.getState().records,
      events: useGarden.getState().companionEvents,
    });
    const draft = {
      channelId: "tomato",
      postType: "成长分享" as const,
      title: "唯一帖子",
      content: "真实本地提交",
      images: [],
      tags: ["小番茄"],
    };
    await communityService.createPost(draft, "same-post");
    await communityService.createPost(draft, "same-post");
    return {
      posts: useCommunity.getState().userPosts.length,
      same:
        before ===
        JSON.stringify({
          plants: useGarden.getState().plants,
          records: useGarden.getState().records,
          events: useGarden.getState().companionEvents,
        }),
    };
  });
  expect(result).toEqual({ posts: 1, same: true });
  const snapshot = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("plant-companion-community-v1")!),
  );
  snapshot.version = 0;
  delete snapshot.state.searchHistory;
  delete snapshot.state.favorites;
  await page.evaluate(
    (s) =>
      localStorage.setItem("plant-companion-community-v1", JSON.stringify(s)),
    snapshot,
  );
  await page.reload();
  await page.goto("/profile/posts");
  await expect(page.locator(".community-post-card")).toHaveCount(1);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("plant-companion-community-v1")!),
  );
  expect(saved.version).toBe(1);
  expect(saved.state.favorites).toEqual([]);
});
test("image count quota is atomic, byte quota is enforced, and missing blobs show fallback", async ({
  page,
}) => {
  await page.goto("/community");
  const result = await page.evaluate(async () => {
    const { saveCommunityImages } = await import(
      "/src/services/communityImages.ts"
    );
    const response = await fetch("/images/hero.jpg");
    const file = new File([await response.blob()], "plant.jpg", {
      type: "image/jpeg",
    });
    const refs = await saveCommunityImages([file]);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("plant-companion-community-images", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      for (let i = 0; i < 39; i++)
        tx.objectStore("images").put({
          id: `quota-${i}`,
          blob: new Blob(["x"]),
          createdAt: new Date().toISOString(),
        });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    let countError = "";
    try {
      await saveCommunityImages([file]);
    } catch (e) {
      countError = (e as Error).message;
    }
    const count = await new Promise<number>((resolve) => {
      const r = db.transaction("images").objectStore("images").count();
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      store.clear();
      store.put({
        id: "large",
        blob: new Blob([new Uint8Array(20 * 1024 * 1024)]),
        createdAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
    });
    let byteError = "";
    try {
      await saveCommunityImages([file]);
    } catch (e) {
      byteError = (e as Error).message;
    }
    db.close();
    return { refs, countError, count, byteError };
  });
  expect(result.count).toBe(40);
  expect(result.countError).toContain("上限");
  expect(result.byteError).toContain("上限");
  await page.evaluate(async () => {
    const { useCommunity } = await import("/src/store/community.ts");
    useCommunity
      .getState()
      .savePost({
        postId: "missing-photo",
        authorId: "local-demo-user",
        channelId: "tomato",
        title: "缺失照片",
        content: "测试",
        images: ["idb:missing"],
        tags: [],
        postType: "日常交流",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        source: "local",
      });
  });
  await page.goto("/community/posts/missing-photo");
  await expect(page.locator(".post-image-grid")).toContainText(
    "图片已不在本地图片库",
  );
});
test("storage failure does not report a published post and leaves garden untouched", async ({
  page,
}) => {
  await page.goto("/community/create");
  await page.getByLabel("帖子标题").fill("保存失败测试");
  await page.getByLabel("帖子正文").fill("本次不应假装发布成功。");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "plant-companion-community-v1")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "发布帖子", exact: true }).click();
  await expect(page.locator(".create-post-form [role=alert]")).toContainText(
    "未能持久保存",
  );
  await expect(page).toHaveURL(/community\/create$/);
  const counts = await page.evaluate(async () => {
    const { useCommunity } = await import("/src/store/community.ts");
    const { useGarden } = await import("/src/store/garden.ts");
    return {
      posts: useCommunity.getState().userPosts.length,
      plants: useGarden.getState().plants.length,
    };
  });
  expect(counts).toEqual({ posts: 0, plants: 4 });
});
test("recommendation and latest ranking differ; all channels are species based", async ({
  page,
}) => {
  await page.goto("/community");
  const result = await page.evaluate(async () => {
    const { communityService, channelForSpecies } = await import(
      "/src/services/community.ts"
    );
    const recommended = await communityService.getPosts({
      channelId: "tomato",
      sort: "recommended",
    });
    const latest = await communityService.getPosts({
      channelId: "tomato",
      sort: "latest",
    });
    return {
      r: recommended.map((p) => p.postId),
      l: latest.map((p) => p.postId),
      flower: channelForSpecies("bougainvillea")?.channelId,
      tomato: channelForSpecies("tomato")?.channelId,
      foliage: channelForSpecies("rubber")?.channelId,
    };
  });
  expect(result.r).not.toEqual(result.l);
  expect(result.flower).toBe("bougainvillea");
  expect(result.tomato).toBe("tomato");
  expect(result.foliage).toBe("foliage");
});

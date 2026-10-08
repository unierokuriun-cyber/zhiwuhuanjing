import { test, expect } from '@playwright/test';
for (const [width, height] of [[375, 812], [402, 874], [768, 1024], [1440, 900]]) {
    test(`companion responsive routes ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        const errors: string[] = [];
        page.on('pageerror', e => errors.push(e.message));
        for (const [route, name] of [['/companion', 'home'], ['/companion/chat/plant-1', 'chat'], ['/companion/achievements', 'achievements'], ['/companion/garden', 'garden']]) {
            await page.goto(route);
            await expect(page.locator('h1')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.screenshot({ path: `work/screenshots/phase4-${name}-${width}.png`, fullPage: true });
        }
        expect(errors).toEqual([]);
    });
}
test('daily companion rewards, growth, chat, persistence and clear', async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 874 });
    await page.goto('/companion');
    await page.getByRole('button', { name: '打招呼', exact: true }).click();
    await page.getByRole('button', { name: '打招呼', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('已领取');
    await page.getByRole('button', { name: '观察植物', exact: true }).click();
    await page.getByLabel('成长观察').fill('今天展开了一片新叶');
    await page.getByRole('button', { name: '保存成长记录' }).click();
    await expect(page.locator('.partner-level')).toContainText('20 XP');
    await page.reload();
    await expect(page.locator('.partner-level')).toContainText('20 XP');
    await page.getByRole('link', { name: '陪我聊聊' }).click();
    await page.getByLabel('输入陪伴消息').fill('今天需要浇水吗？');
    await page.getByRole('button', { name: '发送陪伴消息' }).click();
    await expect(page.locator('.chat-message.assistant')).toContainText('先摸摸盆土');
    await page.reload();
    await expect(page.locator('.chat-message')).toHaveCount(2);
    await page.getByRole('button', { name: '清空聊天记录' }).click();
    await page.getByRole('button', { name: '确认清空' }).click();
    await expect(page.locator('.chat-message')).toHaveCount(0);
    await page.goto('/plants/plant-1');
    await expect(page.locator('.history-entry')).toContainText('今天展开了一片新叶');
    await expect(page.locator('.plant-facts')).toContainText('20 XP');
});
test('shared state, create reward, rename and delete cascade', async ({ page }) => {
    await page.goto('/plants/add');
    await page.getByLabel('植物昵称').fill('测试伙伴');
    await page.getByRole('button', { name: '保存植物档案', exact: true }).click();
    await page.getByRole('link', { name: /测试伙伴/ }).click();
    const id = page.url().split('/').pop()!;
    await page.getByRole('link', { name: '查看这株植物的数字伙伴' }).click();
    await expect(page.locator('.partner-level')).toContainText('20 XP');
    await page.getByRole('button', { name: '记录浇水', exact: true }).click();
    await page.getByRole('button', { name: '确认记录' }).click();
    await expect(page.locator('.partner-level')).toContainText('30 XP');
    await page.getByRole('button', { name: '记录浇水', exact: true }).click();
    await page.getByRole('button', { name: '确认记录' }).click();
    await expect(page.locator('.partner-level')).toContainText('30 XP');
    await page.goto('/companion/achievements');
    await expect(page.locator('.achievement.unlocked')).toHaveCount(2);
    await page.goto(`/plants/${id}/edit`);
    await page.getByLabel('植物昵称').fill('改名伙伴');
    await page.getByRole('button', { name: '保存修改' }).click();
    await page.goto(`/companion?plant=${id}`);
    await expect(page.locator('.partner-hero h2')).toHaveText('改名伙伴');
    await page.goto(`/plants/${id}`);
    await page.getByRole('button', { name: '删除植物档案' }).click();
    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page).toHaveURL(/garden$/);
    const orphan = await page.evaluate(async (id) => { const { useGarden } = await import('/src/store/garden.ts'); const s = useGarden.getState(); return [...s.tasks, ...s.records, ...s.companionEvents, ...s.companionMessages].some(v => v.plantId === id); }, id);
    expect(orphan).toBe(false);
    await page.goto(`/companion/chat/${id}`);
    await expect(page.locator('h1')).toHaveText('找不到这位伙伴');
});
test('explainable moods ignore mock sensor numbers, deterministic leveling and achievements', async ({ page }) => {
    await page.goto('/companion');
    const result = await page.evaluate(async () => {
        const { useGarden } = await import('/src/store/garden.ts');
        const { companionState, growth, achievements } = await import('/src/services/companion.ts');
        const s = useGarden.getState();
        const now = new Date('2026-10-09T12:00:00+08:00');
        const p = { ...s.plants[0], createdAt: now.toISOString(), stage: '成熟期' };
        const mood = (patch: object = {}, records: any[] = [], tasks: any[] = [], events: any[] = []) => companionState({ ...p, ...patch }, records, tasks, events, now);
        const base = { id: 'r', plantId: p.id, text: '照顾', kind: 'water', at: now.toISOString(), xp: 10 };
        const events = [{ id: 'e', plantId: p.id, kind: 'greet', at: now.toISOString(), xp: 5 }];
        const days = ['2026-10-07', '2026-10-08', '2026-10-09'].map((d, i) => ({ ...base, id: `r${i}`, at: `${d}T02:00:00Z` }));
        return { dry: mood({ moisture: 0 }).mood, wet: mood({ moisture: 100 }).mood, thirst: mood({}, [{ ...base, kind: 'observation', text: '盆土干燥' }]).mood, tired: mood({ stage: '休眠期' }).mood, attention: mood({ createdAt: '2026-09-01T00:00:00Z' }).mood, growing: mood({ stage: '生长期' }).mood, happy: mood({}, [], [], events).mood, xp: growth(p.id, [base], events), streak: achievements([p], days, []).find(a => a.id === 'streak') };
    });
    expect(result.dry).toBe(result.wet);
    expect(result.dry).toBe('平静');
    expect(result.thirst).toBe('口渴');
    expect(result.tired).toBe('疲惫');
    expect(result.attention).toBe('需要关注');
    expect(result.growing).toBe('成长中');
    expect(result.happy).toBe('开心');
    expect(result.xp.xp).toBe(15);
    expect(result.streak?.unlocked).toBe(true);
});
test('V3 data migrates without loss or retroactive rewards', async ({ page }) => {
    await page.goto('/garden');
    await page.evaluate(async () => { const { useGarden } = await import('/src/store/garden.ts'); useGarden.getState().recordCare('plant-1', 'water', 'old-water'); const saved = JSON.parse(localStorage.getItem('plant-companion-garden-v1')!); saved.version = 3; delete saved.state.companionMessages; delete saved.state.companionEvents; localStorage.setItem('plant-companion-garden-v1', JSON.stringify(saved)); });
    await page.reload();
    await page.goto('/companion');
    await expect(page.locator('.partner-level')).toContainText('10 XP');
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('plant-companion-garden-v1')!));
    expect(data.version).toBe(4);
    expect(data.state.plants).toHaveLength(4);
    expect(data.state.records[0].id).toBe('old-water');
    expect(data.state.companionEvents).toEqual([]);
});
test('unique events, per-day caps and task reward sync', async ({ page }) => {
    await page.goto('/companion');
    const result = await page.evaluate(async () => { const { useGarden } = await import('/src/store/garden.ts'); const { growth } = await import('/src/services/companion.ts'); const s = useGarden.getState(); for (let i = 0; i < 10; i++) {
        s.companionAction('plant-1', 'greet');
        s.recordCare('plant-1', 'water', `water-${i}`);
        s.completeTask('task-2');
    } const state = useGarden.getState(); return { g: growth('plant-1', state.records, state.companionEvents), events: state.companionEvents.length, records: state.records.length }; });
    expect(result.g.xp).toBe(25);
    expect(result.events).toBe(1);
    expect(result.records).toBe(11);
});
test('all six achievement thresholds and dates are reproducible', async ({ page }) => {
    await page.goto('/companion/achievements');
    const result = await page.evaluate(async () => { const { achievements } = await import('/src/services/companion.ts'); const { useGarden } = await import('/src/store/garden.ts'); const plants = useGarden.getState().plants; const events: any[] = []; const records: any[] = []; for (let i = 0; i < 6; i++) {
        const at = `2026-10-${String(i + 1).padStart(2, '0')}T02:00:00Z`;
        if (i < 5) {
            events.push({ id: `c${i}`, plantId: 'plant-1', kind: 'create', at, xp: 20 });
            records.push({ id: `g${i}`, plantId: 'plant-1', kind: 'growth', text: '新叶', at, xp: 10 });
        }
        events.push({ id: `e${i}`, plantId: 'plant-1', kind: 'greet', at, xp: 5 });
        records.push({ id: `w${i}`, plantId: 'plant-1', kind: 'water', text: '浇水', at, xp: 10 });
    } const a = achievements(plants, records, events); return { a, again: achievements(plants, records, events), empty: achievements(plants, [], []) }; });
    expect(result.a).toEqual(result.again);
    expect(result.a.every(a => a.unlocked)).toBe(true);
    expect(result.empty.every(a => !a.unlocked)).toBe(true);
    expect(result.a.find(a => a.id === 'growth')?.at).toBe('2026-10-05T02:00:00Z');
});
test('keyboard modal focus, empty state, and reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/companion');
    expect(await page.locator('.avatar-leaves').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await page.getByRole('button', { name: '记录浇水', exact: true }).click();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.evaluate(async () => { const { useGarden } = await import('/src/store/garden.ts'); const ids = useGarden.getState().plants.map(p => p.id); ids.forEach(id => useGarden.getState().deletePlant(id)); });
    await expect(page.getByRole('link', { name: '添加植物', exact: true })).toBeVisible();
    await page.goto('/companion/garden');
    await expect(page.getByRole('link', { name: '添加植物', exact: true })).toBeVisible();
});
test('switching plants isolates rewards, feedback and history',async({page})=>{
 await page.goto('/companion');await page.getByRole('button',{name:'打招呼',exact:true}).click();await expect(page.locator('.partner-level')).toContainText('5 XP');await page.getByLabel('关联植物').selectOption('plant-2');await expect(page.locator('.partner-level')).toContainText('0 XP');await expect(page.getByRole('status')).toContainText('今天，想和你一起慢慢生长');await page.getByRole('button',{name:'打招呼',exact:true}).click();await expect(page.locator('.partner-level')).toContainText('5 XP');await page.getByLabel('关联植物').selectOption('plant-1');await expect(page.locator('.partner-level')).toContainText('5 XP');
});
test('multiple care tasks respect per-plant daily cap and calendar shows actual reward',async({page})=>{
 await page.goto('/care/calendar');await page.evaluate(async()=>{const {useGarden}=await import('/src/store/garden.ts');const {dateKey}=await import('/src/utils/dates.ts');const s=useGarden.getState();s.completeTask('task-2');s.addTask('plant-1','同日第二项任务',dateKey());const added=useGarden.getState().tasks.find(t=>t.title==='同日第二项任务')!;s.completeTask(added.id);});await expect(page.locator('.calendar-task').filter({hasText:'同日第二项任务'})).toContainText('已完成 · +0 XP');
});
